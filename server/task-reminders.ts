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
}

export class TaskReminderService {
  private systemUserId: number | null = null;
  private reminderInterval: NodeJS.Timeout | null = null;

  async initialize() {
    // Create or get system user for sending automated messages
    this.systemUserId = await this.ensureSystemUser();
    console.log('[TaskReminder] Service initialized with system user ID:', this.systemUserId);
  }

  private async ensureSystemUser(): Promise<number> {
    // Check if system user exists
    const existingUser = await db.query.users.findFirst({
      where: eq(users.loginId, 'system')
    });

    if (existingUser) {
      return existingUser.id;
    }

    // Create system user
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
    
    // Run immediately
    await this.checkAndSendReminders();

    // Then run periodically
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
      const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

      // Get all tasks that:
      // 1. Have an assignee
      // 2. Are not completed
      // 3. Have a target date
      // 4. Target date is within next 24 hours OR already passed
      const tasksNeedingReminder = await db
        .select({
          id: tasks.id,
          title: tasks.title,
          targetDate: tasks.targetDate,
          assignedTo: tasks.assignedTo,
          assigneeName: users.name,
          status: tasks.status,
        })
        .from(tasks)
        .leftJoin(users, eq(tasks.assignedTo, users.id))
        .where(
          and(
            isNotNull(tasks.assignedTo),
            isNotNull(tasks.targetDate),
            sql`${tasks.status} != 'completed'`,
            or(
              // Overdue tasks
              lte(tasks.targetDate, sql`NOW()`),
              // Tasks due within 24 hours
              and(
                gte(tasks.targetDate, sql`NOW()`),
                lte(tasks.targetDate, sql`NOW() + INTERVAL '24 hours'`)
              )
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
      // Find or create direct conversation between system and user
      const conversationId = await this.findOrCreateSystemConversation(task.assignedTo);

      if (!conversationId) {
        console.error(`[TaskReminder] Could not create conversation for user ${task.assignedTo}`);
        return;
      }

      // Generate reminder message
      const reminderMessage = this.generateReminderMessage(task);

      // Send the message
      await db.insert(messages).values({
        conversationId,
        senderId: this.systemUserId,
        body: reminderMessage,
      });

      console.log(`[TaskReminder] Sent reminder for task "${task.title}" to user ${task.assigneeName}`);

    } catch (error) {
      console.error(`[TaskReminder] Error sending reminder for task ${task.id}:`, error);
    }
  }

  private async findOrCreateSystemConversation(userId: number): Promise<number | null> {
    if (!this.systemUserId) return null;

    // Check if a direct conversation already exists between system and user
    const existingConversation = await db
      .select({ conversationId: conversationMembers.conversationId })
      .from(conversationMembers)
      .where(eq(conversationMembers.userId, this.systemUserId))
      .innerJoin(
        sql`(
          SELECT conversation_id 
          FROM conversation_members 
          WHERE user_id = ${userId}
        ) as user_convs`,
        sql`conversation_members.conversation_id = user_convs.conversation_id`
      )
      .innerJoin(
        conversations,
        eq(conversationMembers.conversationId, conversations.id)
      )
      .where(eq(conversations.isGroup, false))
      .limit(1);

    if (existingConversation.length > 0) {
      return existingConversation[0].conversationId;
    }

    // Create new direct conversation
    const [newConversation] = await db.insert(conversations).values({
      title: null,
      isGroup: false,
    }).returning();

    // Add both users as members
    await db.insert(conversationMembers).values([
      { conversationId: newConversation.id, userId: this.systemUserId },
      { conversationId: newConversation.id, userId },
    ]);

    return newConversation.id;
  }

  private generateReminderMessage(task: TaskForReminder): string {
    if (!task.targetDate) {
      return `📋 Task Reminder: You have a task "${task.title}" assigned to you. Please review and complete it.`;
    }

    const now = new Date();
    const isOverdue = task.targetDate < now;
    const hoursUntilDue = Math.floor((task.targetDate.getTime() - now.getTime()) / (1000 * 60 * 60));

    if (isOverdue) {
      const daysOverdue = Math.ceil((now.getTime() - task.targetDate.getTime()) / (1000 * 60 * 60 * 24));
      return `⚠️ OVERDUE TASK REMINDER\n\n` +
        `Task: "${task.title}"\n` +
        `Status: ${task.status}\n` +
        `Target Date: ${task.targetDate.toLocaleDateString()} ${task.targetDate.toLocaleTimeString()}\n` +
        `Overdue by: ${daysOverdue} day${daysOverdue > 1 ? 's' : ''}\n\n` +
        `Please complete this task as soon as possible or request support if you need assistance.`;
    } else {
      return `⏰ TASK DUE SOON REMINDER\n\n` +
        `Task: "${task.title}"\n` +
        `Status: ${task.status}\n` +
        `Target Date: ${task.targetDate.toLocaleDateString()} ${task.targetDate.toLocaleTimeString()}\n` +
        `Time remaining: ${hoursUntilDue} hour${hoursUntilDue !== 1 ? 's' : ''}\n\n` +
        `Please ensure you complete this task before the deadline or request support if needed.`;
    }
  }
}

// Export singleton instance
export const taskReminderService = new TaskReminderService();
