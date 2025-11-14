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
  type Project,
  type InsertProject,
  type ProjectWithDetails,
  type DriveFolder,
  type InsertDriveFolder,
  type DriveFolderWithDetails,
  type DriveFile,
  type InsertDriveFile,
  type DriveFileWithDetails,
  type ActiveCall,
  type InsertActiveCall,
  type ActiveCallWithDetails,
  type ActiveCallParticipant,
  type InsertActiveCallParticipant,
  type MissedCall,
  type InsertMissedCall,
  type MissedCallWithDetails,
  type Todo,
  type InsertTodo,
  type PushSubscription,
  type InsertPushSubscription,
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
  projects,
  driveFolders,
  driveFiles,
  activeCalls,
  activeCallParticipants,
  missedCalls,
  todos,
  pushSubscriptions,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, or, desc, inArray, sql, gte, lte, isNotNull } from "drizzle-orm";

export interface IStorage {
  getUserById(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByLoginId(loginId: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getAllUsers(): Promise<User[]>;
  getAllAdmins(): Promise<User[]>;
  updateUserPassword(userId: number, hashedPassword: string): Promise<void>;
  updateUserRole(userId: number, role: 'admin' | 'user'): Promise<void>;
  updateUserLastSeen(userId: number): Promise<void>;
  updateUserFirstLoginToday(userId: number, timestamp: Date): Promise<void>;
  updateUserDetails(userId: number, details: { name?: string; loginId?: string }): Promise<void>;
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
  getMessagesByConversationId(conversationId: number, limit?: number): Promise<Message[]>;
  getLastMessageByConversationId(conversationId: number): Promise<Message | undefined>;
  updateMessage(id: number, updates: { body?: string; attachmentUrl?: string | null }): Promise<Message | undefined>;
  deleteMessage(id: number): Promise<void>;
  
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
  
  createProject(project: InsertProject): Promise<Project>;
  getProjectById(id: number): Promise<ProjectWithDetails | undefined>;
  getAllProjects(): Promise<ProjectWithDetails[]>;
  getProjectsByResponsiblePerson(responsiblePersonId: number): Promise<ProjectWithDetails[]>;
  updateProject(id: number, updates: Partial<InsertProject>): Promise<Project | undefined>;
  deleteProject(id: number): Promise<void>;
  
  createDriveFolder(folder: InsertDriveFolder): Promise<DriveFolder>;
  getDriveFolderById(id: number): Promise<DriveFolder | undefined>;
  getAllDriveFolders(userId: number, parentId?: number | null): Promise<DriveFolderWithDetails[]>;
  updateDriveFolder(id: number, updates: Partial<InsertDriveFolder>): Promise<DriveFolder | undefined>;
  deleteDriveFolder(id: number): Promise<void>;
  
  createDriveFile(file: InsertDriveFile): Promise<DriveFile>;
  getDriveFileById(id: number): Promise<DriveFileWithDetails | undefined>;
  getDriveFilesByFolder(userId: number, folderId: number | null): Promise<DriveFileWithDetails[]>;
  getAllDriveFiles(userId: number): Promise<DriveFileWithDetails[]>;
  updateDriveFile(id: number, updates: Partial<InsertDriveFile>): Promise<DriveFile | undefined>;
  deleteDriveFile(id: number): Promise<void>;
  updateDriveFileSyncStatus(id: number, googleDriveId: string, syncStatus: string): Promise<void>;
  updateDriveFolderSyncStatus(id: number, googleDriveId: string, syncStatus: string): Promise<void>;
  
  createActiveCall(call: InsertActiveCall): Promise<ActiveCall>;
  getActiveCallById(id: number): Promise<ActiveCallWithDetails | undefined>;
  getActiveCallByRoomName(roomName: string): Promise<ActiveCallWithDetails | undefined>;
  getActiveCallByConversation(conversationId: number): Promise<ActiveCallWithDetails | undefined>;
  getAllActiveCalls(): Promise<ActiveCallWithDetails[]>;
  getActiveCallsForUser(userId: number): Promise<ActiveCallWithDetails[]>;
  endCall(id: number): Promise<void>;
  isUserInActiveCall(userId: number): Promise<boolean>;
  
  createMissedCall(missedCall: InsertMissedCall): Promise<MissedCall>;
  getMissedCallById(id: number): Promise<MissedCall | undefined>;
  getMissedCallsByReceiver(receiverId: number): Promise<MissedCallWithDetails[]>;
  markMissedCallAsViewed(id: number): Promise<void>;
  deleteMissedCall(id: number): Promise<void>;
  
  addCallParticipant(participant: InsertActiveCallParticipant): Promise<ActiveCallParticipant>;
  getCallParticipants(callId: number): Promise<User[]>;
  removeCallParticipant(callId: number, userId: number): Promise<void>;
  isUserInCall(callId: number, userId: number): Promise<boolean>;
  
  getAllTodos(userId: number): Promise<Todo[]>;
  getTodoById(id: number): Promise<Todo | undefined>;
  createTodo(todo: InsertTodo): Promise<Todo>;
  updateTodo(id: number, updates: Partial<InsertTodo>): Promise<Todo | undefined>;
  deleteTodo(id: number): Promise<void>;
  getTodosNeedingReminders(): Promise<Array<Todo & { userName: string }>>;
  
  savePushSubscription(subscription: InsertPushSubscription): Promise<PushSubscription>;
  getUserPushSubscriptions(userId: number): Promise<PushSubscription[]>;
  deletePushSubscription(endpoint: string): Promise<void>;
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

  async updateUserRole(userId: number, role: 'admin' | 'user'): Promise<void> {
    await db.update(users).set({ role }).where(eq(users.id, userId));
  }

  async updateUserLastSeen(userId: number): Promise<void> {
    await db.update(users).set({ lastSeenAt: new Date() }).where(eq(users.id, userId));
  }

  async updateUserFirstLoginToday(userId: number, timestamp: Date): Promise<void> {
    await db.update(users).set({ firstLoginToday: timestamp }).where(eq(users.id, userId));
  }

  async updateUserDetails(userId: number, details: { name?: string; loginId?: string }): Promise<void> {
    const updates: any = {};
    if (details.name !== undefined) updates.name = details.name;
    if (details.loginId !== undefined) updates.loginId = details.loginId;
    
    if (Object.keys(updates).length > 0) {
      await db.update(users).set(updates).where(eq(users.id, userId));
    }
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

  async getMessagesByConversationId(conversationId: number, limit: number = 50): Promise<Message[]> {
    const limitedMessages = await db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, conversationId))
      .orderBy(desc(messages.createdAt))
      .limit(limit);
    
    return limitedMessages.reverse();
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

  async deleteMessage(id: number): Promise<void> {
    await db.delete(messages).where(eq(messages.id, id));
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

  async createProject(project: InsertProject): Promise<Project> {
    const projectId = `PRJ-${String(Date.now()).slice(-6)}`;
    const result = await db
      .insert(projects)
      .values({ ...project, projectId })
      .returning();
    return result[0];
  }

  async getProjectById(id: number): Promise<ProjectWithDetails | undefined> {
    const result = await db
      .select({
        id: projects.id,
        projectId: projects.projectId,
        projectName: projects.projectName,
        description: projects.description,
        startDate: projects.startDate,
        endDate: projects.endDate,
        actualEndDate: projects.actualEndDate,
        status: projects.status,
        progress: projects.progress,
        responsiblePersonId: projects.responsiblePersonId,
        supportTeam: projects.supportTeam,
        tasksToDo: projects.tasksToDo,
        issues: projects.issues,
        dependencies: projects.dependencies,
        nextSteps: projects.nextSteps,
        targetCompletionDate: projects.targetCompletionDate,
        remarks: projects.remarks,
        attachmentUrl: projects.attachmentUrl,
        priority: projects.priority,
        createdAt: projects.createdAt,
        updatedAt: projects.updatedAt,
        responsiblePersonName: users.name,
      })
      .from(projects)
      .innerJoin(users, eq(projects.responsiblePersonId, users.id))
      .where(eq(projects.id, id))
      .limit(1);
    
    if (!result[0]) return undefined;
    
    const project = result[0];
    const duration = Math.ceil((project.endDate.getTime() - project.startDate.getTime()) / (1000 * 60 * 60 * 24));
    let statusColor: 'green' | 'yellow' | 'red' = 'green';
    
    if (project.status === 'delayed' || project.status === 'on_hold') {
      statusColor = 'red';
    } else if (project.progress < 70) {
      statusColor = 'yellow';
    }
    
    return {
      ...project,
      duration,
      statusColor,
    };
  }

  async getAllProjects(): Promise<ProjectWithDetails[]> {
    const result = await db
      .select({
        id: projects.id,
        projectId: projects.projectId,
        projectName: projects.projectName,
        description: projects.description,
        startDate: projects.startDate,
        endDate: projects.endDate,
        actualEndDate: projects.actualEndDate,
        status: projects.status,
        progress: projects.progress,
        responsiblePersonId: projects.responsiblePersonId,
        supportTeam: projects.supportTeam,
        tasksToDo: projects.tasksToDo,
        issues: projects.issues,
        dependencies: projects.dependencies,
        nextSteps: projects.nextSteps,
        targetCompletionDate: projects.targetCompletionDate,
        remarks: projects.remarks,
        attachmentUrl: projects.attachmentUrl,
        priority: projects.priority,
        createdAt: projects.createdAt,
        updatedAt: projects.updatedAt,
        responsiblePersonName: users.name,
      })
      .from(projects)
      .innerJoin(users, eq(projects.responsiblePersonId, users.id))
      .orderBy(desc(projects.createdAt));
    
    return result.map(project => {
      const duration = Math.ceil((project.endDate.getTime() - project.startDate.getTime()) / (1000 * 60 * 60 * 24));
      let statusColor: 'green' | 'yellow' | 'red' = 'green';
      
      if (project.status === 'delayed' || project.status === 'on_hold') {
        statusColor = 'red';
      } else if (project.progress < 70) {
        statusColor = 'yellow';
      }
      
      return {
        ...project,
        duration,
        statusColor,
      };
    });
  }

  async getProjectsByResponsiblePerson(responsiblePersonId: number): Promise<ProjectWithDetails[]> {
    const result = await db
      .select({
        id: projects.id,
        projectId: projects.projectId,
        projectName: projects.projectName,
        description: projects.description,
        startDate: projects.startDate,
        endDate: projects.endDate,
        actualEndDate: projects.actualEndDate,
        status: projects.status,
        progress: projects.progress,
        responsiblePersonId: projects.responsiblePersonId,
        supportTeam: projects.supportTeam,
        tasksToDo: projects.tasksToDo,
        issues: projects.issues,
        dependencies: projects.dependencies,
        nextSteps: projects.nextSteps,
        targetCompletionDate: projects.targetCompletionDate,
        remarks: projects.remarks,
        attachmentUrl: projects.attachmentUrl,
        priority: projects.priority,
        createdAt: projects.createdAt,
        updatedAt: projects.updatedAt,
        responsiblePersonName: users.name,
      })
      .from(projects)
      .innerJoin(users, eq(projects.responsiblePersonId, users.id))
      .where(eq(projects.responsiblePersonId, responsiblePersonId))
      .orderBy(desc(projects.createdAt));
    
    return result.map(project => {
      const duration = Math.ceil((project.endDate.getTime() - project.startDate.getTime()) / (1000 * 60 * 60 * 24));
      let statusColor: 'green' | 'yellow' | 'red' = 'green';
      
      if (project.status === 'delayed' || project.status === 'on_hold') {
        statusColor = 'red';
      } else if (project.progress < 70) {
        statusColor = 'yellow';
      }
      
      return {
        ...project,
        duration,
        statusColor,
      };
    });
  }

  async updateProject(id: number, updates: Partial<InsertProject>): Promise<Project | undefined> {
    const result = await db
      .update(projects)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(projects.id, id))
      .returning();
    return result[0];
  }

  async deleteProject(id: number): Promise<void> {
    await db.delete(projects).where(eq(projects.id, id));
  }

  async createDriveFolder(folder: InsertDriveFolder): Promise<DriveFolder> {
    const result = await db
      .insert(driveFolders)
      .values({ ...folder, updatedAt: new Date() })
      .returning();
    return result[0];
  }

  async getDriveFolderById(id: number): Promise<DriveFolder | undefined> {
    const result = await db.select().from(driveFolders).where(eq(driveFolders.id, id)).limit(1);
    return result[0];
  }

  async getAllDriveFolders(userId: number, parentId?: number | null): Promise<DriveFolderWithDetails[]> {
    // Build where clause: filter by userId AND parentId
    const userFilter = eq(driveFolders.createdById, userId);
    
    const whereClause = parentId === undefined 
      ? userFilter
      : parentId === null 
        ? and(userFilter, sql`${driveFolders.parentId} IS NULL`)
        : and(userFilter, eq(driveFolders.parentId, parentId));

    const result = await db
      .select({
        id: driveFolders.id,
        name: driveFolders.name,
        parentId: driveFolders.parentId,
        createdById: driveFolders.createdById,
        googleDriveId: driveFolders.googleDriveId,
        syncStatus: driveFolders.syncStatus,
        lastSyncedAt: driveFolders.lastSyncedAt,
        createdAt: driveFolders.createdAt,
        updatedAt: driveFolders.updatedAt,
        createdByName: users.name,
      })
      .from(driveFolders)
      .innerJoin(users, eq(driveFolders.createdById, users.id))
      .where(whereClause)
      .orderBy(driveFolders.name);

    const foldersWithCounts = await Promise.all(
      result.map(async (folder) => {
        const fileCount = await db
          .select({ count: sql<number>`count(*)` })
          .from(driveFiles)
          .where(eq(driveFiles.folderId, folder.id));
        
        const subfolderCount = await db
          .select({ count: sql<number>`count(*)` })
          .from(driveFolders)
          .where(eq(driveFolders.parentId, folder.id));

        return {
          ...folder,
          itemCount: Number(fileCount[0]?.count || 0) + Number(subfolderCount[0]?.count || 0),
        };
      })
    );

    return foldersWithCounts;
  }

  async updateDriveFolder(id: number, updates: Partial<InsertDriveFolder>): Promise<DriveFolder | undefined> {
    const result = await db
      .update(driveFolders)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(driveFolders.id, id))
      .returning();
    return result[0];
  }

  async deleteDriveFolder(id: number): Promise<void> {
    await db.delete(driveFolders).where(eq(driveFolders.id, id));
  }

  async createDriveFile(file: InsertDriveFile): Promise<DriveFile> {
    const result = await db
      .insert(driveFiles)
      .values(file)
      .returning();
    return result[0];
  }

  async getDriveFileById(id: number): Promise<DriveFileWithDetails | undefined> {
    const result = await db
      .select({
        id: driveFiles.id,
        name: driveFiles.name,
        originalName: driveFiles.originalName,
        storagePath: driveFiles.storagePath,
        mimeType: driveFiles.mimeType,
        size: driveFiles.size,
        folderId: driveFiles.folderId,
        uploadedById: driveFiles.uploadedById,
        googleDriveId: driveFiles.googleDriveId,
        syncStatus: driveFiles.syncStatus,
        lastSyncedAt: driveFiles.lastSyncedAt,
        uploadedAt: driveFiles.uploadedAt,
        uploadedByName: users.name,
      })
      .from(driveFiles)
      .innerJoin(users, eq(driveFiles.uploadedById, users.id))
      .where(eq(driveFiles.id, id))
      .limit(1);
    return result[0];
  }

  async getDriveFilesByFolder(userId: number, folderId: number | null): Promise<DriveFileWithDetails[]> {
    // Only return files in folders owned by the user
    // If folderId is null, return files in root level that user uploaded
    if (folderId === null) {
      // Root level files - filter by uploader
      const result = await db
        .select({
          id: driveFiles.id,
          name: driveFiles.name,
          originalName: driveFiles.originalName,
          storagePath: driveFiles.storagePath,
          mimeType: driveFiles.mimeType,
          size: driveFiles.size,
          folderId: driveFiles.folderId,
          uploadedById: driveFiles.uploadedById,
          googleDriveId: driveFiles.googleDriveId,
          syncStatus: driveFiles.syncStatus,
          lastSyncedAt: driveFiles.lastSyncedAt,
          uploadedAt: driveFiles.uploadedAt,
          uploadedByName: users.name,
        })
        .from(driveFiles)
        .innerJoin(users, eq(driveFiles.uploadedById, users.id))
        .where(and(
          sql`${driveFiles.folderId} IS NULL`,
          eq(driveFiles.uploadedById, userId)
        ))
        .orderBy(desc(driveFiles.uploadedAt));
      return result;
    }

    // Files in specific folder - verify folder ownership
    const result = await db
      .select({
        id: driveFiles.id,
        name: driveFiles.name,
        originalName: driveFiles.originalName,
        storagePath: driveFiles.storagePath,
        mimeType: driveFiles.mimeType,
        size: driveFiles.size,
        folderId: driveFiles.folderId,
        uploadedById: driveFiles.uploadedById,
        googleDriveId: driveFiles.googleDriveId,
        syncStatus: driveFiles.syncStatus,
        lastSyncedAt: driveFiles.lastSyncedAt,
        uploadedAt: driveFiles.uploadedAt,
        uploadedByName: users.name,
      })
      .from(driveFiles)
      .innerJoin(users, eq(driveFiles.uploadedById, users.id))
      .innerJoin(driveFolders, eq(driveFiles.folderId, driveFolders.id))
      .where(and(
        eq(driveFiles.folderId, folderId),
        eq(driveFolders.createdById, userId)
      ))
      .orderBy(desc(driveFiles.uploadedAt));
    
    return result;
  }

  async getAllDriveFiles(userId: number): Promise<DriveFileWithDetails[]> {
    // Return all files owned by the user (in their folders or uploaded by them)
    const result = await db
      .select({
        id: driveFiles.id,
        name: driveFiles.name,
        originalName: driveFiles.originalName,
        storagePath: driveFiles.storagePath,
        mimeType: driveFiles.mimeType,
        size: driveFiles.size,
        folderId: driveFiles.folderId,
        uploadedById: driveFiles.uploadedById,
        googleDriveId: driveFiles.googleDriveId,
        syncStatus: driveFiles.syncStatus,
        lastSyncedAt: driveFiles.lastSyncedAt,
        uploadedAt: driveFiles.uploadedAt,
        uploadedByName: users.name,
      })
      .from(driveFiles)
      .innerJoin(users, eq(driveFiles.uploadedById, users.id))
      .leftJoin(driveFolders, eq(driveFiles.folderId, driveFolders.id))
      .where(
        or(
          sql`${driveFiles.folderId} IS NULL AND ${driveFiles.uploadedById} = ${userId}`,
          eq(driveFolders.createdById, userId)
        )
      )
      .orderBy(desc(driveFiles.uploadedAt));
    
    return result;
  }

  async updateDriveFile(id: number, updates: Partial<InsertDriveFile>): Promise<DriveFile | undefined> {
    const result = await db
      .update(driveFiles)
      .set(updates)
      .where(eq(driveFiles.id, id))
      .returning();
    return result[0];
  }

  async deleteDriveFile(id: number): Promise<void> {
    await db.delete(driveFiles).where(eq(driveFiles.id, id));
  }

  async updateDriveFileSyncStatus(id: number, googleDriveId: string, syncStatus: string): Promise<void> {
    await db
      .update(driveFiles)
      .set({ googleDriveId, syncStatus, lastSyncedAt: new Date() })
      .where(eq(driveFiles.id, id));
  }

  async updateDriveFolderSyncStatus(id: number, googleDriveId: string, syncStatus: string): Promise<void> {
    await db
      .update(driveFolders)
      .set({ googleDriveId, syncStatus, lastSyncedAt: new Date() })
      .where(eq(driveFolders.id, id));
  }

  async createActiveCall(call: InsertActiveCall): Promise<ActiveCall> {
    const result = await db.insert(activeCalls).values(call).returning();
    return result[0];
  }

  async getActiveCallById(id: number): Promise<ActiveCallWithDetails | undefined> {
    const result = await db
      .select({
        id: activeCalls.id,
        roomName: activeCalls.roomName,
        roomUrl: activeCalls.roomUrl,
        conversationId: activeCalls.conversationId,
        hostId: activeCalls.hostId,
        callType: activeCalls.callType,
        status: activeCalls.status,
        startedAt: activeCalls.startedAt,
        endedAt: activeCalls.endedAt,
        hostName: users.name,
        participantCount: sql<number>`COUNT(DISTINCT ${activeCallParticipants.userId})::int`,
        participants: sql<string[]>`ARRAY_AGG(DISTINCT ${users.name})`,
      })
      .from(activeCalls)
      .innerJoin(users, eq(activeCalls.hostId, users.id))
      .leftJoin(activeCallParticipants, and(
        eq(activeCallParticipants.callId, activeCalls.id),
        sql`${activeCallParticipants.leftAt} IS NULL`
      ))
      .where(eq(activeCalls.id, id))
      .groupBy(activeCalls.id, users.name)
      .limit(1);
    
    return result[0];
  }

  async getActiveCallByRoomName(roomName: string): Promise<ActiveCallWithDetails | undefined> {
    const result = await db
      .select({
        id: activeCalls.id,
        roomName: activeCalls.roomName,
        roomUrl: activeCalls.roomUrl,
        conversationId: activeCalls.conversationId,
        hostId: activeCalls.hostId,
        callType: activeCalls.callType,
        status: activeCalls.status,
        startedAt: activeCalls.startedAt,
        endedAt: activeCalls.endedAt,
        hostName: users.name,
        participantCount: sql<number>`COUNT(DISTINCT ${activeCallParticipants.userId})::int`,
        participants: sql<string[]>`ARRAY_AGG(DISTINCT ${users.name}) FILTER (WHERE ${users.name} IS NOT NULL)`,
      })
      .from(activeCalls)
      .innerJoin(users, eq(activeCalls.hostId, users.id))
      .leftJoin(activeCallParticipants, and(
        eq(activeCallParticipants.callId, activeCalls.id),
        sql`${activeCallParticipants.leftAt} IS NULL`
      ))
      .where(and(
        eq(activeCalls.roomName, roomName),
        eq(activeCalls.status, 'active')
      ))
      .groupBy(activeCalls.id, users.name)
      .limit(1);
    
    return result[0];
  }

  async getActiveCallByConversation(conversationId: number): Promise<ActiveCallWithDetails | undefined> {
    const result = await db
      .select({
        id: activeCalls.id,
        roomName: activeCalls.roomName,
        roomUrl: activeCalls.roomUrl,
        conversationId: activeCalls.conversationId,
        hostId: activeCalls.hostId,
        callType: activeCalls.callType,
        status: activeCalls.status,
        startedAt: activeCalls.startedAt,
        endedAt: activeCalls.endedAt,
        hostName: users.name,
        participantCount: sql<number>`COUNT(DISTINCT ${activeCallParticipants.userId})::int`,
        participants: sql<string[]>`ARRAY_AGG(DISTINCT ${users.name}) FILTER (WHERE ${users.name} IS NOT NULL)`,
      })
      .from(activeCalls)
      .innerJoin(users, eq(activeCalls.hostId, users.id))
      .leftJoin(activeCallParticipants, and(
        eq(activeCallParticipants.callId, activeCalls.id),
        sql`${activeCallParticipants.leftAt} IS NULL`
      ))
      .where(and(
        eq(activeCalls.conversationId, conversationId),
        eq(activeCalls.status, 'active')
      ))
      .groupBy(activeCalls.id, users.name)
      .limit(1);
    
    return result[0];
  }

  async getAllActiveCalls(): Promise<ActiveCallWithDetails[]> {
    const result = await db
      .select({
        id: activeCalls.id,
        roomName: activeCalls.roomName,
        roomUrl: activeCalls.roomUrl,
        conversationId: activeCalls.conversationId,
        hostId: activeCalls.hostId,
        callType: activeCalls.callType,
        status: activeCalls.status,
        startedAt: activeCalls.startedAt,
        endedAt: activeCalls.endedAt,
        hostName: users.name,
        participantCount: sql<number>`COUNT(DISTINCT ${activeCallParticipants.userId})::int`,
        participants: sql<string[]>`ARRAY_AGG(DISTINCT ${users.name}) FILTER (WHERE ${users.name} IS NOT NULL)`,
      })
      .from(activeCalls)
      .innerJoin(users, eq(activeCalls.hostId, users.id))
      .leftJoin(activeCallParticipants, and(
        eq(activeCallParticipants.callId, activeCalls.id),
        sql`${activeCallParticipants.leftAt} IS NULL`
      ))
      .where(eq(activeCalls.status, 'active'))
      .groupBy(activeCalls.id, users.name)
      .orderBy(desc(activeCalls.startedAt));
    
    return result;
  }

  async getActiveCallsForUser(userId: number): Promise<ActiveCallWithDetails[]> {
    const result = await db
      .select({
        id: activeCalls.id,
        roomName: activeCalls.roomName,
        roomUrl: activeCalls.roomUrl,
        conversationId: activeCalls.conversationId,
        hostId: activeCalls.hostId,
        callType: activeCalls.callType,
        status: activeCalls.status,
        startedAt: activeCalls.startedAt,
        endedAt: activeCalls.endedAt,
        hostName: users.name,
        participantCount: sql<number>`COUNT(DISTINCT ${activeCallParticipants.userId})::int`,
        participants: sql<string[]>`ARRAY_AGG(DISTINCT ${users.name}) FILTER (WHERE ${users.name} IS NOT NULL)`,
      })
      .from(activeCalls)
      .innerJoin(users, eq(activeCalls.hostId, users.id))
      .leftJoin(activeCallParticipants, and(
        eq(activeCallParticipants.callId, activeCalls.id),
        sql`${activeCallParticipants.leftAt} IS NULL`
      ))
      .where(and(
        eq(activeCalls.status, 'active'),
        or(
          eq(activeCalls.hostId, userId),
          sql`EXISTS(SELECT 1 FROM ${activeCallParticipants} WHERE ${activeCallParticipants.callId} = ${activeCalls.id} AND ${activeCallParticipants.userId} = ${userId} AND ${activeCallParticipants.leftAt} IS NULL)`
        )
      ))
      .groupBy(activeCalls.id, users.name)
      .orderBy(desc(activeCalls.startedAt));
    
    return result;
  }

  async endCall(id: number): Promise<void> {
    await db
      .update(activeCalls)
      .set({
        status: 'ended',
        endedAt: new Date(),
      })
      .where(eq(activeCalls.id, id));
    
    // Mark all participants as left
    await db
      .update(activeCallParticipants)
      .set({ leftAt: new Date() })
      .where(and(
        eq(activeCallParticipants.callId, id),
        sql`${activeCallParticipants.leftAt} IS NULL`
      ));
  }

  async isUserInActiveCall(userId: number): Promise<boolean> {
    const result = await db
      .select({ id: activeCallParticipants.id })
      .from(activeCallParticipants)
      .innerJoin(activeCalls, eq(activeCallParticipants.callId, activeCalls.id))
      .where(and(
        eq(activeCallParticipants.userId, userId),
        eq(activeCalls.status, 'active'),
        sql`${activeCallParticipants.leftAt} IS NULL`
      ))
      .limit(1);
    
    return result.length > 0;
  }

  async createMissedCall(missedCall: InsertMissedCall): Promise<MissedCall> {
    const result = await db.insert(missedCalls).values(missedCall).returning();
    return result[0];
  }

  async getMissedCallById(id: number): Promise<MissedCall | undefined> {
    const result = await db
      .select()
      .from(missedCalls)
      .where(eq(missedCalls.id, id))
      .limit(1);
    
    return result[0];
  }

  async getMissedCallsByReceiver(receiverId: number): Promise<MissedCallWithDetails[]> {
    const result = await db
      .select({
        id: missedCalls.id,
        callerId: missedCalls.callerId,
        receiverId: missedCalls.receiverId,
        conversationId: missedCalls.conversationId,
        callType: missedCalls.callType,
        missedAt: missedCalls.missedAt,
        viewed: missedCalls.viewed,
        viewedAt: missedCalls.viewedAt,
        callerName: users.name,
        callerAvatar: users.avatar,
      })
      .from(missedCalls)
      .innerJoin(users, eq(missedCalls.callerId, users.id))
      .where(eq(missedCalls.receiverId, receiverId))
      .orderBy(desc(missedCalls.missedAt));
    
    return result;
  }

  async markMissedCallAsViewed(id: number): Promise<void> {
    await db
      .update(missedCalls)
      .set({
        viewed: true,
        viewedAt: new Date(),
      })
      .where(eq(missedCalls.id, id));
  }

  async deleteMissedCall(id: number): Promise<void> {
    await db.delete(missedCalls).where(eq(missedCalls.id, id));
  }

  async addCallParticipant(participant: InsertActiveCallParticipant): Promise<ActiveCallParticipant> {
    const result = await db.insert(activeCallParticipants).values(participant).returning();
    return result[0];
  }

  async getCallParticipants(callId: number): Promise<User[]> {
    const result = await db
      .select({
        id: users.id,
        name: users.name,
        loginId: users.loginId,
        email: users.email,
        password: users.password,
        role: users.role,
        avatar: users.avatar,
        lastSeenAt: users.lastSeenAt,
        createdAt: users.createdAt,
      })
      .from(activeCallParticipants)
      .innerJoin(users, eq(activeCallParticipants.userId, users.id))
      .where(and(
        eq(activeCallParticipants.callId, callId),
        sql`${activeCallParticipants.leftAt} IS NULL`
      ));
    
    return result;
  }

  async removeCallParticipant(callId: number, userId: number): Promise<void> {
    await db
      .update(activeCallParticipants)
      .set({ leftAt: new Date() })
      .where(and(
        eq(activeCallParticipants.callId, callId),
        eq(activeCallParticipants.userId, userId),
        sql`${activeCallParticipants.leftAt} IS NULL`
      ));
  }

  async isUserInCall(callId: number, userId: number): Promise<boolean> {
    const result = await db
      .select({ id: activeCallParticipants.id })
      .from(activeCallParticipants)
      .where(and(
        eq(activeCallParticipants.callId, callId),
        eq(activeCallParticipants.userId, userId),
        sql`${activeCallParticipants.leftAt} IS NULL`
      ))
      .limit(1);
    
    return result.length > 0;
  }

  async getAllTodos(userId: number): Promise<Todo[]> {
    const result = await db
      .select()
      .from(todos)
      .where(eq(todos.userId, userId))
      .orderBy(desc(todos.createdAt));
    return result;
  }

  async getTodoById(id: number): Promise<Todo | undefined> {
    const result = await db
      .select()
      .from(todos)
      .where(eq(todos.id, id))
      .limit(1);
    return result[0];
  }

  async createTodo(todo: InsertTodo): Promise<Todo> {
    const result = await db.insert(todos).values(todo).returning();
    return result[0];
  }

  async updateTodo(id: number, updates: Partial<InsertTodo>): Promise<Todo | undefined> {
    const result = await db
      .update(todos)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(todos.id, id))
      .returning();
    return result[0];
  }

  async deleteTodo(id: number): Promise<void> {
    await db.delete(todos).where(eq(todos.id, id));
  }

  async getTodosNeedingReminders(): Promise<Array<Todo & { userName: string }>> {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const result = await db
      .select({
        id: todos.id,
        userId: todos.userId,
        task: todos.task,
        priority: todos.priority,
        completed: todos.completed,
        targetDate: todos.targetDate,
        targetTime: todos.targetTime,
        reminderEnabled: todos.reminderEnabled,
        reminderSent: todos.reminderSent,
        createdAt: todos.createdAt,
        updatedAt: todos.updatedAt,
        userName: users.name,
      })
      .from(todos)
      .leftJoin(users, eq(todos.userId, users.id))
      .where(
        and(
          eq(todos.reminderEnabled, true),
          eq(todos.reminderSent, false),
          eq(todos.completed, false),
          isNotNull(todos.targetDate)
        )
      );

    return result as Array<Todo & { userName: string }>;
  }

  async savePushSubscription(subscription: InsertPushSubscription): Promise<PushSubscription> {
    const existing = await db
      .select()
      .from(pushSubscriptions)
      .where(and(
        eq(pushSubscriptions.userId, subscription.userId),
        eq(pushSubscriptions.endpoint, subscription.endpoint)
      ))
      .limit(1);

    if (existing.length > 0) {
      const result = await db
        .update(pushSubscriptions)
        .set({
          p256dhKey: subscription.p256dhKey,
          authKey: subscription.authKey,
        })
        .where(eq(pushSubscriptions.id, existing[0].id))
        .returning();
      return result[0];
    }

    const result = await db.insert(pushSubscriptions).values(subscription).returning();
    return result[0];
  }

  async getUserPushSubscriptions(userId: number): Promise<PushSubscription[]> {
    return db
      .select()
      .from(pushSubscriptions)
      .where(eq(pushSubscriptions.userId, userId));
  }

  async deletePushSubscription(endpoint: string): Promise<void> {
    await db.delete(pushSubscriptions).where(eq(pushSubscriptions.endpoint, endpoint));
  }
}

export const storage = new PostgresStorage();
