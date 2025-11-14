import { db } from './db';
import { meetings, meetingParticipants, users, conversations, conversationMembers, messages } from '@shared/schema';
import { eq, and, lte, gte, isNotNull, sql } from 'drizzle-orm';

interface MeetingForReminder {
  id: number;
  title: string;
  startTime: Date;
  endTime: Date;
  reminderSent15Min: boolean;
  reminderSent5Min: boolean;
  participantIds: number[];
  participantNames: string[];
}

export class MeetingReminderService {
  private systemUserId: number | null = null;
  private reminderInterval: NodeJS.Timeout | null = null;

  async initialize() {
    this.systemUserId = await this.ensureSystemUser();
    console.log('[MeetingReminder] Service initialized with system user ID:', this.systemUserId);
  }

  private async ensureSystemUser(): Promise<number> {
    const adminUser = await db.query.users.findFirst({
      where: eq(users.loginId, 'admin')
    });

    if (!adminUser) {
      throw new Error('[MeetingReminder] Admin user not found. Cannot send reminders.');
    }

    return adminUser.id;
  }

  async start(checkIntervalMinutes: number = 1) {
    await this.initialize();
    
    await this.checkAndSendReminders();

    this.reminderInterval = setInterval(
      () => this.checkAndSendReminders(),
      checkIntervalMinutes * 60 * 1000
    );

    console.log(`[MeetingReminder] Started with ${checkIntervalMinutes} minute interval`);
  }

  stop() {
    if (this.reminderInterval) {
      clearInterval(this.reminderInterval);
      this.reminderInterval = null;
      console.log('[MeetingReminder] Service stopped');
    }
  }

  private async checkAndSendReminders() {
    try {
      console.log('[MeetingReminder] Checking for meetings needing reminders...');
      
      const now = new Date();
      const in15Minutes = new Date(now.getTime() + 15 * 60 * 1000);
      const in5Minutes = new Date(now.getTime() + 5 * 60 * 1000);

      const upcomingMeetings = await db
        .select({
          id: meetings.id,
          title: meetings.title,
          startTime: meetings.startTime,
          endTime: meetings.endTime,
          reminderSent15Min: meetings.reminderSent15Min,
          reminderSent5Min: meetings.reminderSent5Min,
        })
        .from(meetings)
        .where(
          and(
            gte(meetings.startTime, now),
            lte(meetings.startTime, in15Minutes)
          )
        );

      console.log(`[MeetingReminder] Found ${upcomingMeetings.length} upcoming meetings`);

      for (const meeting of upcomingMeetings) {
        const participants = await db
          .select({
            userId: meetingParticipants.userId,
            userName: users.name,
          })
          .from(meetingParticipants)
          .leftJoin(users, eq(meetingParticipants.userId, users.id))
          .where(eq(meetingParticipants.meetingId, meeting.id));

        const meetingWithParticipants: MeetingForReminder = {
          ...meeting,
          participantIds: participants.map(p => p.userId),
          participantNames: participants.map(p => p.userName || 'Unknown'),
        };

        const minutesUntilMeeting = (meeting.startTime.getTime() - now.getTime()) / (1000 * 60);

        if (minutesUntilMeeting <= 15 && minutesUntilMeeting > 5 && !meeting.reminderSent15Min) {
          await this.send15MinReminder(meetingWithParticipants);
        }

        if (minutesUntilMeeting <= 5 && !meeting.reminderSent5Min) {
          await this.send5MinReminder(meetingWithParticipants);
        }
      }

    } catch (error) {
      console.error('[MeetingReminder] Error checking reminders:', error);
    }
  }

  private async send15MinReminder(meeting: MeetingForReminder) {
    if (!this.systemUserId) return;

    try {
      for (const participantId of meeting.participantIds) {
        const conversationId = await this.findOrCreateSystemConversation(participantId);

        if (!conversationId) {
          console.error(`[MeetingReminder] Could not create conversation for user ${participantId}`);
          continue;
        }

        const reminderMessage = this.generate15MinReminderMessage(meeting);

        await db.insert(messages).values({
          conversationId,
          senderId: this.systemUserId,
          body: reminderMessage,
        });
      }

      await db.update(meetings)
        .set({ reminderSent15Min: true })
        .where(eq(meetings.id, meeting.id));

      console.log(`[MeetingReminder] Sent 15-minute reminder for meeting "${meeting.title}" to ${meeting.participantIds.length} participants`);

    } catch (error) {
      console.error(`[MeetingReminder] Error sending 15-min reminder for meeting ${meeting.id}:`, error);
    }
  }

  private async send5MinReminder(meeting: MeetingForReminder) {
    if (!this.systemUserId) return;

    try {
      for (const participantId of meeting.participantIds) {
        const conversationId = await this.findOrCreateSystemConversation(participantId);

        if (!conversationId) {
          console.error(`[MeetingReminder] Could not create conversation for user ${participantId}`);
          continue;
        }

        const reminderMessage = this.generate5MinReminderMessage(meeting);

        await db.insert(messages).values({
          conversationId,
          senderId: this.systemUserId,
          body: reminderMessage,
        });
      }

      await db.update(meetings)
        .set({ reminderSent5Min: true })
        .where(eq(meetings.id, meeting.id));

      console.log(`[MeetingReminder] Sent 5-minute reminder for meeting "${meeting.title}" to ${meeting.participantIds.length} participants`);

    } catch (error) {
      console.error(`[MeetingReminder] Error sending 5-min reminder for meeting ${meeting.id}:`, error);
    }
  }

  private async findOrCreateSystemConversation(userId: number): Promise<number | null> {
    if (!this.systemUserId) return null;

    const systemConvIds = await db
      .select({ conversationId: conversationMembers.conversationId })
      .from(conversationMembers)
      .where(eq(conversationMembers.userId, this.systemUserId));

    const userConvIds = await db
      .select({ conversationId: conversationMembers.conversationId })
      .from(conversationMembers)
      .where(eq(conversationMembers.userId, userId));

    const systemConvIdSet = new Set(systemConvIds.map(c => c.conversationId));
    const userConvIdSet = new Set(userConvIds.map(c => c.conversationId));
    
    const sharedConvIds = Array.from(systemConvIdSet).filter(id => userConvIdSet.has(id));

    if (sharedConvIds.length > 0) {
      const directConv = await db.query.conversations.findFirst({
        where: and(
          sql`${conversations.id} = ANY(${sharedConvIds})`,
          eq(conversations.isGroup, false)
        )
      });

      if (directConv) {
        return directConv.id;
      }
    }

    const [newConversation] = await db.insert(conversations).values({
      title: null,
      isGroup: false,
    }).returning();

    await db.insert(conversationMembers).values([
      { conversationId: newConversation.id, userId: this.systemUserId },
      { conversationId: newConversation.id, userId },
    ]);

    return newConversation.id;
  }

  private generate15MinReminderMessage(meeting: MeetingForReminder): string {
    const startTimeStr = meeting.startTime.toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });

    return `[MEETING REMINDER - 15 MINUTES]\n\n` +
      `Meeting: "${meeting.title}"\n` +
      `Start Time: ${startTimeStr} IST\n` +
      `Participants: ${meeting.participantNames.join(', ')}\n\n` +
      `Your meeting will start in 15 minutes. Please prepare to join.`;
  }

  private generate5MinReminderMessage(meeting: MeetingForReminder): string {
    const startTimeStr = meeting.startTime.toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });

    return `[MEETING STARTING SOON - 5 MINUTES]\n\n` +
      `Meeting: "${meeting.title}"\n` +
      `Start Time: ${startTimeStr} IST\n` +
      `Participants: ${meeting.participantNames.join(', ')}\n\n` +
      `Your meeting will start in 5 minutes! Please join now.`;
  }
}

export const meetingReminderService = new MeetingReminderService();
