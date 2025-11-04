import { 
  type User, 
  type InsertUser,
  type Conversation,
  type InsertConversation,
  type Message,
  type InsertMessage,
  type UpdateMessage,
  type ConversationMember,
  type InsertConversationMember,
  type PinnedConversation,
  type InsertPinnedConversation,
  type ConversationReadStatus,
  type InsertConversationReadStatus,
  type Meeting,
  type InsertMeeting,
  type MeetingParticipant,
  type InsertMeetingParticipant,
  type Task,
  type InsertTask,
  type TaskWithDetails,
  type SupportRequest,
  type InsertSupportRequest,
  type DailyWorksheet,
  type InsertDailyWorksheet,
  type DailyWorksheetWithDetails,
  users,
  conversations,
  messages,
  conversationMembers,
  pinnedConversations,
  conversationReadStatus,
  meetings,
  meetingParticipants,
  tasks,
  taskSupportRequests,
  dailyWorksheets,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, inArray, sql, gte, lte } from "drizzle-orm";

export interface IStorage {
  getUserById(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByLoginId(loginId: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getAllUsers(): Promise<User[]>;
  getAllAdmins(): Promise<User[]>;
  updateUserPassword(userId: number, hashedPassword: string): Promise<void>;
  updateUserLastSeen(userId: number): Promise<void>;
  deleteUser(userId: number): Promise<void>;
  
  createConversation(conversation: InsertConversation): Promise<Conversation>;
  getConversationById(id: number): Promise<Conversation | undefined>;
  getConversationsByUserId(userId: number): Promise<Conversation[]>;
  findDirectConversationBetweenUsers(userId1: number, userId2: number): Promise<Conversation | undefined>;
  
  addConversationMember(member: InsertConversationMember): Promise<ConversationMember>;
  addConversationMemberWithHistory(member: { conversationId: number; userId: number; canViewHistory: boolean }): Promise<ConversationMember>;
  getConversationMembers(conversationId: number): Promise<User[]>;
  getConversationMemberInfo(conversationId: number, userId: number): Promise<{ joinedAt: Date; canViewHistory: boolean } | undefined>;
  getUserConversationIds(userId: number): Promise<number[]>;
  
  getPinnedConversations(userId: number): Promise<number[]>;
  pinConversation(userId: number, conversationId: number): Promise<PinnedConversation>;
  unpinConversation(userId: number, conversationId: number): Promise<void>;
  countPinnedConversations(userId: number): Promise<number>;
  isPinned(userId: number, conversationId: number): Promise<boolean>;
  
  createMessage(message: InsertMessage): Promise<Message>;
  getMessageById(id: number): Promise<Message | undefined>;
  getMessagesByConversationId(conversationId: number): Promise<Message[]>;
  getLastMessageByConversationId(conversationId: number): Promise<Message | undefined>;
  updateMessage(id: number, updates: { body?: string; attachmentUrl?: string | null }): Promise<Message | undefined>;
  
  markConversationAsRead(userId: number, conversationId: number, lastMessageId: number | null): Promise<void>;
  getUnreadCount(userId: number, conversationId: number): Promise<number>;
  getReadStatus(userId: number, conversationId: number): Promise<ConversationReadStatus | undefined>;
  
  createMeeting(meeting: InsertMeeting): Promise<Meeting>;
  getAllMeetings(): Promise<Meeting[]>;
  getMeetingById(id: number): Promise<Meeting | undefined>;
  updateMeeting(id: number, updates: Partial<InsertMeeting>): Promise<void>;
  deleteMeeting(id: number): Promise<void>;
  updateMeetingSummary(meetingId: number, summary: string, language: string): Promise<void>;
  addMeetingParticipant(participant: InsertMeetingParticipant): Promise<MeetingParticipant>;
  getMeetingParticipants(meetingId: number): Promise<User[]>;
  removeMeetingParticipant(meetingId: number, userId: number): Promise<void>;
  clearMeetingParticipants(meetingId: number): Promise<void>;
  
  createTask(task: InsertTask): Promise<Task>;
  getTaskById(id: number): Promise<TaskWithDetails | undefined>;
  getTasksByCreator(creatorId: number): Promise<TaskWithDetails[]>;
  getTasksByAssignee(assigneeId: number): Promise<TaskWithDetails[]>;
  getAllTasksForUser(userId: number): Promise<TaskWithDetails[]>;
  getAllTasks(): Promise<TaskWithDetails[]>;
  updateTask(id: number, updates: Partial<InsertTask>): Promise<Task | undefined>;
  deleteTask(id: number): Promise<void>;
  
  createSupportRequest(request: InsertSupportRequest): Promise<SupportRequest>;
  getSupportRequestsByTask(taskId: number): Promise<SupportRequest[]>;
  updateSupportRequestStatus(id: number, status: string): Promise<void>;
  
  createDailyWorksheet(worksheet: InsertDailyWorksheet): Promise<DailyWorksheet>;
  getDailyWorksheet(userId: number, date: Date): Promise<DailyWorksheet | undefined>;
  updateDailyWorksheet(id: number, updates: Partial<InsertDailyWorksheet>): Promise<DailyWorksheet | undefined>;
  submitDailyWorksheet(id: number): Promise<DailyWorksheet | undefined>;
  getAllDailyWorksheets(date?: Date): Promise<DailyWorksheetWithDetails[]>;
  getUserDailyWorksheets(userId: number, limit?: number): Promise<DailyWorksheetWithDetails[]>;
}

export class PostgresStorage implements IStorage {
  async getUserById(id: number): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    if (!email) return undefined;
    const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
    return result[0];
  }

  async getUserByLoginId(loginId: string): Promise<User | undefined> {
    // Case-insensitive login ID lookup
    const result = await db.select().from(users).where(
      sql`LOWER(${users.loginId}) = LOWER(${loginId})`
    ).limit(1);
    return result[0];
  }

  async createUser(user: InsertUser): Promise<User> {
    // Convert empty email string to null
    const userData: typeof user & { email?: string | null } = {
      ...user,
      email: user.email && user.email.trim() !== '' ? user.email : null,
    };
    const result = await db.insert(users).values(userData as any).returning();
    return result[0];
  }

  async getAllUsers(): Promise<User[]> {
    return db.select().from(users);
  }

  async getAllAdmins(): Promise<User[]> {
    return db.select().from(users).where(eq(users.role, 'admin'));
  }

  async updateUserPassword(userId: number, hashedPassword: string): Promise<void> {
    await db.update(users).set({ password: hashedPassword }).where(eq(users.id, userId));
  }

  async updateUserLastSeen(userId: number): Promise<void> {
    await db.update(users).set({ lastSeenAt: new Date() }).where(eq(users.id, userId));
  }

  async deleteUser(userId: number): Promise<void> {
    // First, delete user's conversation memberships
    await db.delete(conversationMembers).where(eq(conversationMembers.userId, userId));
    // Then delete the user
    await db.delete(users).where(eq(users.id, userId));
  }

  async createConversation(conversation: InsertConversation): Promise<Conversation> {
    const result = await db.insert(conversations).values(conversation).returning();
    return result[0];
  }

  async getConversationById(id: number): Promise<Conversation | undefined> {
    const result = await db.select().from(conversations).where(eq(conversations.id, id)).limit(1);
    return result[0];
  }

  async getConversationsByUserId(userId: number): Promise<Conversation[]> {
    const userConvIds = await this.getUserConversationIds(userId);
    if (userConvIds.length === 0) return [];
    
    return db
      .select()
      .from(conversations)
      .where(inArray(conversations.id, userConvIds))
      .orderBy(desc(conversations.createdAt));
  }

  async findDirectConversationBetweenUsers(userId1: number, userId2: number): Promise<Conversation | undefined> {
    // Get all conversation IDs for both users
    const user1ConvIds = await this.getUserConversationIds(userId1);
    const user2ConvIds = await this.getUserConversationIds(userId2);
    
    // Find common conversation IDs
    const commonConvIds = user1ConvIds.filter(id => user2ConvIds.includes(id));
    
    if (commonConvIds.length === 0) return undefined;
    
    // Get conversations that are direct (not group) and have exactly 2 members
    for (const convId of commonConvIds) {
      const conv = await this.getConversationById(convId);
      if (!conv || conv.isGroup) continue;
      
      const members = await db
        .select()
        .from(conversationMembers)
        .where(eq(conversationMembers.conversationId, convId));
      
      // Check if it's a direct conversation (exactly 2 members)
      if (members.length === 2) {
        const memberIds = members.map(m => m.userId);
        if (memberIds.includes(userId1) && memberIds.includes(userId2)) {
          return conv;
        }
      }
    }
    
    return undefined;
  }

  async addConversationMember(member: InsertConversationMember): Promise<ConversationMember> {
    const result = await db.insert(conversationMembers).values(member).returning();
    return result[0];
  }

  async addConversationMemberWithHistory(member: { conversationId: number; userId: number; canViewHistory: boolean }): Promise<ConversationMember> {
    const result = await db.insert(conversationMembers).values({
      conversationId: member.conversationId,
      userId: member.userId,
      canViewHistory: member.canViewHistory,
    }).returning();
    return result[0];
  }

  async getConversationMembers(conversationId: number): Promise<User[]> {
    const result = await db
      .select({
        id: users.id,
        name: users.name,
        loginId: users.loginId,
        email: users.email,
        password: users.password,
        role: users.role,
        avatar: users.avatar,
        createdAt: users.createdAt,
      })
      .from(conversationMembers)
      .innerJoin(users, eq(conversationMembers.userId, users.id))
      .where(eq(conversationMembers.conversationId, conversationId));
    
    return result;
  }

  async getUserConversationIds(userId: number): Promise<number[]> {
    const result = await db
      .select({ conversationId: conversationMembers.conversationId })
      .from(conversationMembers)
      .where(eq(conversationMembers.userId, userId));
    
    return result.map(r => r.conversationId);
  }

  async getConversationMemberInfo(conversationId: number, userId: number): Promise<{ joinedAt: Date; canViewHistory: boolean } | undefined> {
    const result = await db
      .select({
        joinedAt: conversationMembers.joinedAt,
        canViewHistory: conversationMembers.canViewHistory,
      })
      .from(conversationMembers)
      .where(
        and(
          eq(conversationMembers.conversationId, conversationId),
          eq(conversationMembers.userId, userId)
        )
      )
      .limit(1);
    
    if (!result[0]) return undefined;
    
    return {
      joinedAt: result[0].joinedAt,
      canViewHistory: result[0].canViewHistory,
    };
  }

  async getPinnedConversations(userId: number): Promise<number[]> {
    const result = await db
      .select({ conversationId: pinnedConversations.conversationId })
      .from(pinnedConversations)
      .where(eq(pinnedConversations.userId, userId))
      .orderBy(desc(pinnedConversations.pinnedAt));
    
    return result.map(r => r.conversationId);
  }

  async pinConversation(userId: number, conversationId: number): Promise<PinnedConversation> {
    const result = await db
      .insert(pinnedConversations)
      .values({ userId, conversationId })
      .returning();
    return result[0];
  }

  async unpinConversation(userId: number, conversationId: number): Promise<void> {
    await db
      .delete(pinnedConversations)
      .where(
        and(
          eq(pinnedConversations.userId, userId),
          eq(pinnedConversations.conversationId, conversationId)
        )
      );
  }

  async countPinnedConversations(userId: number): Promise<number> {
    const result = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(pinnedConversations)
      .where(eq(pinnedConversations.userId, userId));
    
    return result[0]?.count || 0;
  }

  async isPinned(userId: number, conversationId: number): Promise<boolean> {
    const result = await db
      .select({ id: pinnedConversations.id })
      .from(pinnedConversations)
      .where(
        and(
          eq(pinnedConversations.userId, userId),
          eq(pinnedConversations.conversationId, conversationId)
        )
      )
      .limit(1);
    
    return result.length > 0;
  }

  async createMessage(message: InsertMessage): Promise<Message> {
    const result = await db.insert(messages).values(message).returning();
    return result[0];
  }

  async getMessageById(id: number): Promise<Message | undefined> {
    const result = await db.select().from(messages).where(eq(messages.id, id)).limit(1);
    return result[0];
  }

  async getMessagesByConversationId(conversationId: number): Promise<Message[]> {
    return db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, conversationId))
      .orderBy(messages.createdAt);
  }

  async updateMessage(id: number, updates: { body?: string; attachmentUrl?: string | null }): Promise<Message | undefined> {
    const result = await db
      .update(messages)
      .set({ 
        ...updates,
        editedAt: new Date(),
      })
      .where(eq(messages.id, id))
      .returning();
    return result[0];
  }

  async getLastMessageByConversationId(conversationId: number): Promise<Message | undefined> {
    const result = await db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, conversationId))
      .orderBy(desc(messages.createdAt))
      .limit(1);
    
    return result[0];
  }

  async markConversationAsRead(userId: number, conversationId: number, lastMessageId: number | null): Promise<void> {
    const existing = await db
      .select()
      .from(conversationReadStatus)
      .where(
        and(
          eq(conversationReadStatus.userId, userId),
          eq(conversationReadStatus.conversationId, conversationId)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      await db
        .update(conversationReadStatus)
        .set({
          lastReadMessageId: lastMessageId,
          lastReadAt: new Date(),
        })
        .where(
          and(
            eq(conversationReadStatus.userId, userId),
            eq(conversationReadStatus.conversationId, conversationId)
          )
        );
    } else {
      await db.insert(conversationReadStatus).values({
        userId,
        conversationId,
        lastReadMessageId: lastMessageId,
      });
    }
  }

  async getUnreadCount(userId: number, conversationId: number): Promise<number> {
    const readStatus = await this.getReadStatus(userId, conversationId);
    
    if (!readStatus || !readStatus.lastReadMessageId) {
      // Count all messages NOT sent by the user
      const result = await db
        .select({ count: sql<number>`count(*)` })
        .from(messages)
        .where(
          and(
            eq(messages.conversationId, conversationId),
            sql`${messages.senderId} != ${userId}`
          )
        );
      return Number(result[0]?.count || 0);
    }

    // Count messages after the last read message, NOT sent by the user
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(messages)
      .where(
        and(
          eq(messages.conversationId, conversationId),
          sql`${messages.id} > ${readStatus.lastReadMessageId}`,
          sql`${messages.senderId} != ${userId}`
        )
      );
    return Number(result[0]?.count || 0);
  }

  async getReadStatus(userId: number, conversationId: number): Promise<ConversationReadStatus | undefined> {
    const result = await db
      .select()
      .from(conversationReadStatus)
      .where(
        and(
          eq(conversationReadStatus.userId, userId),
          eq(conversationReadStatus.conversationId, conversationId)
        )
      )
      .limit(1);
    
    return result[0];
  }

  async createMeeting(meeting: InsertMeeting): Promise<Meeting> {
    const result = await db.insert(meetings).values(meeting).returning();
    return result[0];
  }

  async getAllMeetings(): Promise<Meeting[]> {
    return db.select().from(meetings).orderBy(meetings.startTime);
  }

  async getMeetingById(id: number): Promise<Meeting | undefined> {
    const result = await db.select().from(meetings).where(eq(meetings.id, id)).limit(1);
    return result[0];
  }

  async updateMeeting(id: number, updates: Partial<InsertMeeting>): Promise<void> {
    await db.update(meetings).set(updates).where(eq(meetings.id, id));
  }

  async deleteMeeting(id: number): Promise<void> {
    await db.delete(meetings).where(eq(meetings.id, id));
  }

  async updateMeetingSummary(meetingId: number, summary: string, language: string): Promise<void> {
    await db
      .update(meetings)
      .set({ summary, summaryLanguage: language })
      .where(eq(meetings.id, meetingId));
  }

  async addMeetingParticipant(participant: InsertMeetingParticipant): Promise<MeetingParticipant> {
    const result = await db.insert(meetingParticipants).values(participant).returning();
    return result[0];
  }

  async getMeetingParticipants(meetingId: number): Promise<User[]> {
    const result = await db
      .select({
        id: users.id,
        name: users.name,
        loginId: users.loginId,
        email: users.email,
        password: users.password,
        role: users.role,
        avatar: users.avatar,
        createdAt: users.createdAt,
      })
      .from(meetingParticipants)
      .innerJoin(users, eq(meetingParticipants.userId, users.id))
      .where(eq(meetingParticipants.meetingId, meetingId));
    
    return result;
  }

  async removeMeetingParticipant(meetingId: number, userId: number): Promise<void> {
    await db.delete(meetingParticipants).where(
      and(
        eq(meetingParticipants.meetingId, meetingId),
        eq(meetingParticipants.userId, userId)
      )
    );
  }

  async clearMeetingParticipants(meetingId: number): Promise<void> {
    await db.delete(meetingParticipants).where(eq(meetingParticipants.meetingId, meetingId));
  }

  async createTask(task: InsertTask): Promise<Task> {
    const result = await db.insert(tasks).values(task).returning();
    return result[0];
  }

  async getTaskById(id: number): Promise<TaskWithDetails | undefined> {
    const result = await db
      .select({
        id: tasks.id,
        title: tasks.title,
        description: tasks.description,
        startDate: tasks.startDate,
        targetDate: tasks.targetDate,
        status: tasks.status,
        completionPercentage: tasks.completionPercentage,
        statusUpdateReason: tasks.statusUpdateReason,
        remark: tasks.remark,
        createdBy: tasks.createdBy,
        assignedTo: tasks.assignedTo,
        conversationId: tasks.conversationId,
        reminderFrequency: tasks.reminderFrequency,
        lastReminderSent: tasks.lastReminderSent,
        createdAt: tasks.createdAt,
        updatedAt: tasks.updatedAt,
        creatorName: users.name,
        assigneeName: sql<string>`assignee.name`,
      })
      .from(tasks)
      .innerJoin(users, eq(tasks.createdBy, users.id))
      .leftJoin(sql`users as assignee`, sql`tasks.assigned_to = assignee.id`)
      .where(eq(tasks.id, id))
      .limit(1);

    return result[0] as TaskWithDetails | undefined;
  }

  async getTasksByCreator(creatorId: number): Promise<TaskWithDetails[]> {
    const result = await db
      .select({
        id: tasks.id,
        title: tasks.title,
        description: tasks.description,
        startDate: tasks.startDate,
        targetDate: tasks.targetDate,
        status: tasks.status,
        completionPercentage: tasks.completionPercentage,
        statusUpdateReason: tasks.statusUpdateReason,
        remark: tasks.remark,
        createdBy: tasks.createdBy,
        assignedTo: tasks.assignedTo,
        conversationId: tasks.conversationId,
        reminderFrequency: tasks.reminderFrequency,
        lastReminderSent: tasks.lastReminderSent,
        createdAt: tasks.createdAt,
        updatedAt: tasks.updatedAt,
        creatorName: users.name,
        assigneeName: sql<string>`assignee.name`,
      })
      .from(tasks)
      .innerJoin(users, eq(tasks.createdBy, users.id))
      .leftJoin(sql`users as assignee`, sql`tasks.assigned_to = assignee.id`)
      .where(eq(tasks.createdBy, creatorId))
      .orderBy(desc(tasks.createdAt));

    return result as TaskWithDetails[];
  }

  async getTasksByAssignee(assigneeId: number): Promise<TaskWithDetails[]> {
    const result = await db
      .select({
        id: tasks.id,
        title: tasks.title,
        description: tasks.description,
        startDate: tasks.startDate,
        targetDate: tasks.targetDate,
        status: tasks.status,
        completionPercentage: tasks.completionPercentage,
        statusUpdateReason: tasks.statusUpdateReason,
        remark: tasks.remark,
        createdBy: tasks.createdBy,
        assignedTo: tasks.assignedTo,
        conversationId: tasks.conversationId,
        reminderFrequency: tasks.reminderFrequency,
        lastReminderSent: tasks.lastReminderSent,
        createdAt: tasks.createdAt,
        updatedAt: tasks.updatedAt,
        creatorName: users.name,
        assigneeName: sql<string>`assignee.name`,
      })
      .from(tasks)
      .innerJoin(users, eq(tasks.createdBy, users.id))
      .leftJoin(sql`users as assignee`, sql`tasks.assigned_to = assignee.id`)
      .where(eq(tasks.assignedTo, assigneeId))
      .orderBy(desc(tasks.createdAt));

    return result as TaskWithDetails[];
  }

  async getAllTasksForUser(userId: number): Promise<TaskWithDetails[]> {
    const result = await db
      .select({
        id: tasks.id,
        title: tasks.title,
        description: tasks.description,
        startDate: tasks.startDate,
        targetDate: tasks.targetDate,
        status: tasks.status,
        completionPercentage: tasks.completionPercentage,
        statusUpdateReason: tasks.statusUpdateReason,
        remark: tasks.remark,
        createdBy: tasks.createdBy,
        assignedTo: tasks.assignedTo,
        conversationId: tasks.conversationId,
        reminderFrequency: tasks.reminderFrequency,
        lastReminderSent: tasks.lastReminderSent,
        createdAt: tasks.createdAt,
        updatedAt: tasks.updatedAt,
        creatorName: users.name,
        assigneeName: sql<string>`assignee.name`,
      })
      .from(tasks)
      .innerJoin(users, eq(tasks.createdBy, users.id))
      .leftJoin(sql`users as assignee`, sql`tasks.assigned_to = assignee.id`)
      .where(
        sql`${tasks.createdBy} = ${userId} OR ${tasks.assignedTo} = ${userId}`
      )
      .orderBy(desc(tasks.createdAt));

    return result as TaskWithDetails[];
  }

  async getAllTasks(): Promise<TaskWithDetails[]> {
    const result = await db
      .select({
        id: tasks.id,
        title: tasks.title,
        description: tasks.description,
        startDate: tasks.startDate,
        targetDate: tasks.targetDate,
        status: tasks.status,
        completionPercentage: tasks.completionPercentage,
        statusUpdateReason: tasks.statusUpdateReason,
        remark: tasks.remark,
        createdBy: tasks.createdBy,
        assignedTo: tasks.assignedTo,
        conversationId: tasks.conversationId,
        reminderFrequency: tasks.reminderFrequency,
        lastReminderSent: tasks.lastReminderSent,
        createdAt: tasks.createdAt,
        updatedAt: tasks.updatedAt,
        creatorName: users.name,
        assigneeName: sql<string>`assignee.name`,
      })
      .from(tasks)
      .innerJoin(users, eq(tasks.createdBy, users.id))
      .leftJoin(sql`users as assignee`, sql`tasks.assigned_to = assignee.id`)
      .orderBy(desc(tasks.createdAt));

    return result as TaskWithDetails[];
  }

  async updateTask(id: number, updates: Partial<InsertTask>): Promise<Task | undefined> {
    const result = await db
      .update(tasks)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(tasks.id, id))
      .returning();
    return result[0];
  }

  async deleteTask(id: number): Promise<void> {
    await db.delete(tasks).where(eq(tasks.id, id));
  }

  async createSupportRequest(request: InsertSupportRequest): Promise<SupportRequest> {
    const result = await db.insert(taskSupportRequests).values(request).returning();
    return result[0];
  }

  async getSupportRequestsByTask(taskId: number): Promise<SupportRequest[]> {
    return db
      .select()
      .from(taskSupportRequests)
      .where(eq(taskSupportRequests.taskId, taskId))
      .orderBy(desc(taskSupportRequests.createdAt));
  }

  async updateSupportRequestStatus(id: number, status: string): Promise<void> {
    await db
      .update(taskSupportRequests)
      .set({ status })
      .where(eq(taskSupportRequests.id, id));
  }

  async createDailyWorksheet(worksheet: InsertDailyWorksheet): Promise<DailyWorksheet> {
    const result = await db.insert(dailyWorksheets).values(worksheet).returning();
    return result[0];
  }

  async getDailyWorksheet(userId: number, date: Date): Promise<DailyWorksheet | undefined> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const result = await db
      .select()
      .from(dailyWorksheets)
      .where(
        and(
          eq(dailyWorksheets.userId, userId),
          gte(dailyWorksheets.date, startOfDay),
          lte(dailyWorksheets.date, endOfDay)
        )
      )
      .limit(1);
    
    return result[0];
  }

  async updateDailyWorksheet(id: number, updates: Partial<InsertDailyWorksheet>): Promise<DailyWorksheet | undefined> {
    const result = await db
      .update(dailyWorksheets)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(dailyWorksheets.id, id))
      .returning();
    return result[0];
  }

  async submitDailyWorksheet(id: number): Promise<DailyWorksheet | undefined> {
    const result = await db
      .update(dailyWorksheets)
      .set({ 
        status: 'submitted',
        submittedAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(dailyWorksheets.id, id))
      .returning();
    return result[0];
  }

  async getAllDailyWorksheets(date?: Date): Promise<DailyWorksheetWithDetails[]> {
    let query = db
      .select({
        id: dailyWorksheets.id,
        userId: dailyWorksheets.userId,
        date: dailyWorksheets.date,
        todos: dailyWorksheets.todos,
        hourlyLogs: dailyWorksheets.hourlyLogs,
        status: dailyWorksheets.status,
        submittedAt: dailyWorksheets.submittedAt,
        createdAt: dailyWorksheets.createdAt,
        updatedAt: dailyWorksheets.updatedAt,
        userName: users.name,
      })
      .from(dailyWorksheets)
      .innerJoin(users, eq(dailyWorksheets.userId, users.id));

    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      
      query = query.where(
        and(
          gte(dailyWorksheets.date, startOfDay),
          lte(dailyWorksheets.date, endOfDay)
        )
      ) as typeof query;
    }

    const result = await query.orderBy(desc(dailyWorksheets.date));
    
    return result.map(row => ({
      ...row,
      parsedTodos: JSON.parse(row.todos || '[]'),
      parsedHourlyLogs: JSON.parse(row.hourlyLogs || '[]'),
    }));
  }

  async getUserDailyWorksheets(userId: number, limit: number = 30): Promise<DailyWorksheetWithDetails[]> {
    const result = await db
      .select({
        id: dailyWorksheets.id,
        userId: dailyWorksheets.userId,
        date: dailyWorksheets.date,
        todos: dailyWorksheets.todos,
        hourlyLogs: dailyWorksheets.hourlyLogs,
        status: dailyWorksheets.status,
        submittedAt: dailyWorksheets.submittedAt,
        createdAt: dailyWorksheets.createdAt,
        updatedAt: dailyWorksheets.updatedAt,
        userName: users.name,
      })
      .from(dailyWorksheets)
      .innerJoin(users, eq(dailyWorksheets.userId, users.id))
      .where(eq(dailyWorksheets.userId, userId))
      .orderBy(desc(dailyWorksheets.date))
      .limit(limit);
    
    return result.map(row => ({
      ...row,
      parsedTodos: JSON.parse(row.todos || '[]'),
      parsedHourlyLogs: JSON.parse(row.hourlyLogs || '[]'),
    }));
  }
}

export const storage = new PostgresStorage();
