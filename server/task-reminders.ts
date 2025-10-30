import { db } from './db';
import { tasks, users, conversations, conversationMembers, messages } from '@shared/schema';
import { eq, and, lte, gte, isNotNull, sql, or } from 'drizzle-orm';

interface TaskForReminder {
  id: number;
  title: string;
  targetDate: Date | null;
  assignedTo: number | null;
  assigneeName: string | null;
  status: string;
  lastReminderSent: Date | null;
}

const REMINDER_COOLDOWN_HOURS = 24;

export class TaskReminderService {
  private systemUserId: number | null = null;
  private reminderInterval: NodeJS.Timeout | null = null;

  async initialize() {
    this.systemUserId = await this.ensureSystemUser();
    console.log('[TaskReminder] Service initialized with system user ID:', this.systemUserId);
  }

  private async ensureSystemUser(): Promise<number> {
    const existingUser = await db.query.users.findFirst({
      where: eq(users.loginId, 'system')
    });

    if (existingUser) {
      return existingUser.id;
    }

    const [systemUser] = await db.insert(users).values({
      name: 'System',
      loginId: 'system',
      email: 'system@supremo.internal',
      password: 'disabled',
      role: 'admin'
    }).returning();

    return systemUser.id;
  }

  async start(checkIntervalMinutes: number = 60) {
    await this.initialize();
    
    await this.checkAndSendReminders();

    this.reminderInterval = setInterval(
      () => this.checkAndSendReminders(),
      checkIntervalMinutes * 60 * 1000
    );

    console.log(`[TaskReminder] Started with ${checkIntervalMinutes} minute interval`);
  }

  stop() {
    if (this.reminderInterval) {
      clearInterval(this.reminderInterval);
      this.reminderInterval = null;
      console.log('[TaskReminder] Service stopped');
    }
  }

  private async checkAndSendReminders() {
    try {
      console.log('[TaskReminder] Checking for tasks needing reminders...');
      
      const now = new Date();
      const cooldownTime = new Date(now.getTime() - REMINDER_COOLDOWN_HOURS * 60 * 60 * 1000);

      const tasksNeedingReminder = await db
        .select({
          id: tasks.id,
          title: tasks.title,
          targetDate: tasks.targetDate,
          assignedTo: tasks.assignedTo,
          assigneeName: users.name,
          status: tasks.status,
          lastReminderSent: tasks.lastReminderSent,
        })
        .from(tasks)
        .leftJoin(users, eq(tasks.assignedTo, users.id))
        .where(
          and(
            isNotNull(tasks.assignedTo),
            isNotNull(tasks.targetDate),
            sql`${tasks.status} != 'completed'`,
            sql`${tasks.status} != 'cancelled'`,
            or(
              lte(tasks.targetDate, sql`NOW()`),
              and(
                gte(tasks.targetDate, sql`NOW()`),
                lte(tasks.targetDate, sql`NOW() + INTERVAL '24 hours'`)
              )
            ),
            or(
              sql`${tasks.lastReminderSent} IS NULL`,
              lte(tasks.lastReminderSent, cooldownTime)
            )
          )
        );

      console.log(`[TaskReminder] Found ${tasksNeedingReminder.length} tasks needing reminders`);

      for (const task of tasksNeedingReminder) {
        if (task.assignedTo) {
          await this.sendReminderToUser(task as TaskForReminder);
        }
      }

    } catch (error) {
      console.error('[TaskReminder] Error checking reminders:', error);
    }
  }

  private async sendReminderToUser(task: TaskForReminder) {
    if (!this.systemUserId || !task.assignedTo) return;

    try {
      const conversationId = await this.findOrCreateSystemConversation(task.assignedTo);

      if (!conversationId) {
        console.error(`[TaskReminder] Could not create conversation for user ${task.assignedTo}`);
        return;
      }

      const reminderMessage = this.generateReminderMessage(task);

      await db.insert(messages).values({
        conversationId,
        senderId: this.systemUserId,
        body: reminderMessage,
      });

      await db.update(tasks)
        .set({ lastReminderSent: new Date() })
        .where(eq(tasks.id, task.id));

      console.log(`[TaskReminder] Sent reminder for task "${task.title}" to user ${task.assigneeName}`);

    } catch (error) {
      console.error(`[TaskReminder] Error sending reminder for task ${task.id}:`, error);
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

  private generateReminderMessage(task: TaskForReminder): string {
    if (!task.targetDate) {
      return `[TASK REMINDER]\n\n` +
        `Task: "${task.title}"\n` +
        `Status: ${task.status}\n\n` +
        `You have a task assigned to you. Please review and complete it.`;
    }

    const now = new Date();
    const isOverdue = task.targetDate < now;
    const hoursUntilDue = Math.floor((task.targetDate.getTime() - now.getTime()) / (1000 * 60 * 60));

    if (isOverdue) {
      const daysOverdue = Math.ceil((now.getTime() - task.targetDate.getTime()) / (1000 * 60 * 60 * 24));
      return `[URGENT - OVERDUE TASK]\n\n` +
        `Task: "${task.title}"\n` +
        `Status: ${task.status}\n` +
        `Target Date: ${task.targetDate.toLocaleDateString()} ${task.targetDate.toLocaleTimeString()}\n` +
        `Overdue by: ${daysOverdue} day${daysOverdue > 1 ? 's' : ''}\n\n` +
        `Please complete this task as soon as possible or request support if you need assistance.`;
    } else {
      return `[TASK DUE SOON]\n\n` +
        `Task: "${task.title}"\n` +
        `Status: ${task.status}\n` +
        `Target Date: ${task.targetDate.toLocaleDateString()} ${task.targetDate.toLocaleTimeString()}\n` +
        `Time remaining: ${hoursUntilDue} hour${hoursUntilDue !== 1 ? 's' : ''}\n\n` +
        `Please ensure you complete this task before the deadline or request support if needed.`;
    }
  }
}

export const taskReminderService = new TaskReminderService();
