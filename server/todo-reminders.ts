import { db } from './db';
import { todos, users, conversations, conversationMembers, messages } from '@shared/schema';
import { eq, and, isNotNull } from 'drizzle-orm';
import { storage } from './storage';

export class TodoReminderService {
  private systemUserId: number | null = null;
  private reminderInterval: NodeJS.Timeout | null = null;

  async initialize() {
    this.systemUserId = await this.ensureSystemUser();
    console.log('[TodoReminder] Service initialized with system user ID:', this.systemUserId);
  }

  private async ensureSystemUser(): Promise<number> {
    const adminUser = await db.query.users.findFirst({
      where: eq(users.loginId, 'admin')
    });

    if (!adminUser) {
      throw new Error('[TodoReminder] Admin user not found. Cannot send reminders.');
    }

    return adminUser.id;
  }

  async start(checkIntervalMinutes: number = 60) {
    await this.initialize();
    
    await this.checkAndSendReminders();

    this.reminderInterval = setInterval(
      () => this.checkAndSendReminders(),
      checkIntervalMinutes * 60 * 1000
    );

    console.log(`[TodoReminder] Started with ${checkIntervalMinutes} minute interval`);
  }

  stop() {
    if (this.reminderInterval) {
      clearInterval(this.reminderInterval);
      this.reminderInterval = null;
      console.log('[TodoReminder] Service stopped');
    }
  }

  private async checkAndSendReminders() {
    try {
      console.log('[TodoReminder] Checking for todos needing reminders...');
      
      const todosToRemind = await storage.getTodosNeedingReminders();
      
      console.log(`[TodoReminder] Found ${todosToRemind.length} todos needing reminders`);

      for (const todo of todosToRemind) {
        if (!todo.userId || !todo.targetDate) continue;

        const now = new Date();
        const targetDate = new Date(todo.targetDate);
        const hoursUntilDue = (targetDate.getTime() - now.getTime()) / (1000 * 60 * 60);

        // Send reminder if due within 24 hours or overdue
        if (hoursUntilDue <= 24) {
          await this.sendReminderMessage(todo);
          
          // Mark reminder as sent
          await storage.updateTodo(todo.id, { reminderSent: true });
        }
      }
    } catch (error) {
      console.error('[TodoReminder] Error checking and sending reminders:', error);
    }
  }

  private async sendReminderMessage(todo: any) {
    if (!this.systemUserId) {
      console.error('[TodoReminder] System user not initialized');
      return;
    }

    try {
      // Find or create a conversation between system user and the assignee
      const existingConversation = await this.findOrCreateConversation(todo.userId);
      
      if (!existingConversation) {
        console.error('[TodoReminder] Could not create conversation for todo reminder');
        return;
      }

      const now = new Date();
      const targetDate = new Date(todo.targetDate);
      const isOverdue = targetDate < now;
      const hoursUntilDue = Math.abs((targetDate.getTime() - now.getTime()) / (1000 * 60 * 60));
      
      let timeMessage = '';
      if (isOverdue) {
        timeMessage = `⚠️ **OVERDUE** by ${Math.round(hoursUntilDue)} hours`;
      } else {
        timeMessage = `⏰ Due in ${Math.round(hoursUntilDue)} hours`;
      }

      const targetTimeInfo = todo.targetTime ? ` at ${todo.targetTime}` : '';
      const priorityBadge = this.getPriorityBadge(todo.priority);

      const message = `📋 **To-Do Reminder**\n\n${priorityBadge} **Task:** ${todo.task}\n\n${timeMessage}\n**Target Date:** ${targetDate.toLocaleDateString()}${targetTimeInfo}\n\n_This is an automated reminder for your to-do item._`;

      await db.insert(messages).values({
        conversationId: existingConversation.id,
        senderId: this.systemUserId,
        content: message,
      });

      console.log(`[TodoReminder] Sent reminder for todo ${todo.id} to user ${todo.userName}`);
    } catch (error) {
      console.error('[TodoReminder] Error sending reminder message:', error);
    }
  }

  private getPriorityBadge(priority: string): string {
    switch (priority) {
      case 'urgent':
        return '🔴 **URGENT**';
      case 'high':
        return '🟠 **HIGH PRIORITY**';
      case 'medium':
        return '🟡 **MEDIUM PRIORITY**';
      case 'low':
        return '🟢 **LOW PRIORITY**';
      default:
        return '';
    }
  }

  private async findOrCreateConversation(userId: number): Promise<{ id: number } | null> {
    if (!this.systemUserId) return null;

    // Find existing conversation between system user and assignee
    const existingConversations = await db
      .select({
        conversationId: conversationMembers.conversationId,
      })
      .from(conversationMembers)
      .innerJoin(
        conversations,
        eq(conversationMembers.conversationId, conversations.id)
      )
      .where(
        and(
          eq(conversationMembers.userId, this.systemUserId),
          eq(conversations.isGroup, false)
        )
      );

    for (const conv of existingConversations) {
      const members = await db
        .select()
        .from(conversationMembers)
        .where(eq(conversationMembers.conversationId, conv.conversationId));

      const memberIds = members.map(m => m.userId);
      if (memberIds.length === 2 && 
          memberIds.includes(this.systemUserId) && 
          memberIds.includes(userId)) {
        return { id: conv.conversationId };
      }
    }

    // Create new conversation
    const [newConversation] = await db.insert(conversations).values({
      isGroup: false,
    }).returning();

    await db.insert(conversationMembers).values([
      { conversationId: newConversation.id, userId: this.systemUserId },
      { conversationId: newConversation.id, userId: userId },
    ]);

    return { id: newConversation.id };
  }
}

export const todoReminderService = new TodoReminderService();
