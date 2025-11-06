import { sql } from "drizzle-orm";
import { pgTable, text, varchar, boolean, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const userRoleEnum = z.enum(["admin", "user"]);
export type UserRole = z.infer<typeof userRoleEnum>;

export const taskStatusEnum = z.enum(["pending", "in_progress", "completed", "cancelled"]);
export type TaskStatus = z.infer<typeof taskStatusEnum>;

export const reminderFrequencyEnum = z.enum(["none", "hourly", "every_3_hours", "every_6_hours", "daily", "every_2_days"]);
export type ReminderFrequency = z.infer<typeof reminderFrequencyEnum>;

export const users = pgTable("users", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  name: text("name").notNull(),
  loginId: text("login_id").notNull().unique(),
  email: text("email"),
  password: text("password").notNull(),
  role: text("role").notNull().default("user"),
  avatar: text("avatar"),
  lastSeenAt: timestamp("last_seen_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

const _baseUserSchema = createInsertSchema(users, {
  loginId: z.string().min(3).max(32).regex(/^[a-zA-Z0-9_-]+$/, "Login ID can only contain letters, numbers, dashes, and underscores"),
  role: userRoleEnum.default("user"),
});

export const insertUserSchema = _baseUserSchema.omit({
  // @ts-ignore - drizzle-zod type inference issue
  id: true,
  // @ts-ignore - drizzle-zod type inference issue
  createdAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export const conversations = pgTable("conversations", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  title: text("title"),
  isGroup: boolean("is_group").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

const _baseConversationSchema = createInsertSchema(conversations, {});

export const insertConversationSchema = _baseConversationSchema.omit({
  // @ts-ignore - drizzle-zod type inference issue
  id: true,
  // @ts-ignore - drizzle-zod type inference issue
  createdAt: true,
});

export type InsertConversation = z.infer<typeof insertConversationSchema>;
export type Conversation = typeof conversations.$inferSelect;
export type ConversationWithDetails = Conversation & {
  members: string;
  memberIds: number[];
  memberCount: number;
  lastMessage?: string;
  lastMessageTime?: Date;
};

export const conversationMembers = pgTable("conversation_members", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  conversationId: integer("conversation_id").notNull().references(() => conversations.id, { onDelete: "cascade" }),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  joinedAt: timestamp("joined_at").notNull().defaultNow(),
  canViewHistory: boolean("can_view_history").notNull().default(true),
});

const _baseConversationMemberSchema = createInsertSchema(conversationMembers, {});

export const insertConversationMemberSchema = _baseConversationMemberSchema.omit({
  // @ts-ignore - drizzle-zod type inference issue
  id: true,
  // @ts-ignore - drizzle-zod type inference issue
  joinedAt: true,
});

export type InsertConversationMember = z.infer<typeof insertConversationMemberSchema>;
export type ConversationMember = typeof conversationMembers.$inferSelect;

export const pinnedConversations = pgTable("pinned_conversations", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  conversationId: integer("conversation_id").notNull().references(() => conversations.id, { onDelete: "cascade" }),
  pinnedAt: timestamp("pinned_at").notNull().defaultNow(),
});

const _basePinnedConversationSchema = createInsertSchema(pinnedConversations, {});

export const insertPinnedConversationSchema = _basePinnedConversationSchema.omit({
  // @ts-ignore - drizzle-zod type inference issue
  id: true,
  // @ts-ignore - drizzle-zod type inference issue
  pinnedAt: true,
});

export type InsertPinnedConversation = z.infer<typeof insertPinnedConversationSchema>;
export type PinnedConversation = typeof pinnedConversations.$inferSelect;

export const conversationReadStatus = pgTable("conversation_read_status", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  conversationId: integer("conversation_id").notNull().references(() => conversations.id, { onDelete: "cascade" }),
  lastReadMessageId: integer("last_read_message_id"),
  lastReadAt: timestamp("last_read_at").notNull().defaultNow(),
});

const _baseConversationReadStatusSchema = createInsertSchema(conversationReadStatus, {});

export const insertConversationReadStatusSchema = _baseConversationReadStatusSchema.omit({
  // @ts-ignore - drizzle-zod type inference issue
  id: true,
  // @ts-ignore - drizzle-zod type inference issue
  lastReadAt: true,
});

export type InsertConversationReadStatus = z.infer<typeof insertConversationReadStatusSchema>;
export type ConversationReadStatus = typeof conversationReadStatus.$inferSelect;

export const messages = pgTable("messages", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  conversationId: integer("conversation_id").notNull().references(() => conversations.id, { onDelete: "cascade" }),
  senderId: integer("sender_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  body: text("body"),
  attachmentUrl: text("attachment_url"),
  editedAt: timestamp("edited_at"),
  forwardedFromId: integer("forwarded_from_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

const _baseMessageSchema = createInsertSchema(messages, {});

export const insertMessageSchema = _baseMessageSchema.omit({
  // @ts-ignore - drizzle-zod type inference issue
  id: true,
  // @ts-ignore - drizzle-zod type inference issue
  createdAt: true,
  // @ts-ignore - drizzle-zod type inference issue
  editedAt: true,
});

export const updateMessageSchema = z.object({
  body: z.string().optional(),
  attachmentUrl: z.string().optional().nullable(),
});

export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type UpdateMessage = z.infer<typeof updateMessageSchema>;
export type Message = typeof messages.$inferSelect;

export const recurrencePatternEnum = z.enum(["none", "daily", "weekly", "monthly"]);
export type RecurrencePattern = z.infer<typeof recurrencePatternEnum>;

export const meetings = pgTable("meetings", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  title: text("title").notNull(),
  description: text("description"),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time").notNull(),
  meetingLink: text("meeting_link"),
  recurrencePattern: text("recurrence_pattern").notNull().default("none"),
  recurrenceFrequency: integer("recurrence_frequency").default(1),
  recurrenceEndDate: timestamp("recurrence_end_date"),
  summary: text("summary"),
  summaryLanguage: text("summary_language").default("en"),
  createdBy: integer("created_by").notNull().references(() => users.id, { onDelete: "cascade" }),
  reminderSent15Min: boolean("reminder_sent_15_min").notNull().default(false),
  reminderSent5Min: boolean("reminder_sent_5_min").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

const _baseMeetingSchema = createInsertSchema(meetings, {
  startTime: z.string().transform((val) => new Date(val)),
  endTime: z.string().transform((val) => new Date(val)),
  recurrencePattern: recurrencePatternEnum.default("none"),
  recurrenceEndDate: z.string().optional().nullable().refine((val) => !val || !isNaN(Date.parse(val)), {
    message: "Recurrence end date must be a valid date string",
  }).transform((val) => val ? new Date(val) : null),
  meetingLink: z.string().optional(),
});

export const insertMeetingSchema = _baseMeetingSchema.omit({
  // @ts-ignore - drizzle-zod type inference issue
  id: true,
  // @ts-ignore - drizzle-zod type inference issue
  createdAt: true,
});

export type InsertMeeting = z.infer<typeof insertMeetingSchema>;
export type Meeting = typeof meetings.$inferSelect;

export const meetingParticipants = pgTable("meeting_participants", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  meetingId: integer("meeting_id").notNull().references(() => meetings.id, { onDelete: "cascade" }),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  addedAt: timestamp("added_at").notNull().defaultNow(),
});

const _baseMeetingParticipantSchema = createInsertSchema(meetingParticipants, {});

export const insertMeetingParticipantSchema = _baseMeetingParticipantSchema.omit({
  // @ts-ignore - drizzle-zod type inference issue
  id: true,
  // @ts-ignore - drizzle-zod type inference issue
  addedAt: true,
});

export type InsertMeetingParticipant = z.infer<typeof insertMeetingParticipantSchema>;
export type MeetingParticipant = typeof meetingParticipants.$inferSelect;

export const tasks = pgTable("tasks", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  title: text("title").notNull(),
  description: text("description"),
  startDate: timestamp("start_date"),
  targetDate: timestamp("target_date"),
  status: text("status").notNull().default("pending"),
  completionPercentage: integer("completion_percentage").notNull().default(0),
  statusUpdateReason: text("status_update_reason"),
  remark: text("remark"),
  createdBy: integer("created_by").notNull().references(() => users.id, { onDelete: "cascade" }),
  assignedTo: integer("assigned_to").references(() => users.id, { onDelete: "set null" }),
  conversationId: integer("conversation_id").references(() => conversations.id, { onDelete: "set null" }),
  reminderFrequency: text("reminder_frequency").notNull().default("daily"),
  lastReminderSent: timestamp("last_reminder_sent"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

const _baseTaskSchema = createInsertSchema(tasks, {
  startDate: z.string().optional().nullable().refine((val) => !val || !isNaN(Date.parse(val)), {
    message: "Start date must be a valid date string",
  }).transform((val) => val ? new Date(val) : null),
  targetDate: z.string().optional().nullable().refine((val) => !val || !isNaN(Date.parse(val)), {
    message: "Target date must be a valid date string",
  }).transform((val) => val ? new Date(val) : null),
  status: taskStatusEnum.default("pending"),
  reminderFrequency: reminderFrequencyEnum.default("daily"),
});

export const insertTaskSchema = _baseTaskSchema.omit({
  // @ts-ignore - drizzle-zod type inference issue
  id: true,
  // @ts-ignore - drizzle-zod type inference issue
  createdAt: true,
  // @ts-ignore - drizzle-zod type inference issue
  updatedAt: true,
});

export type InsertTask = z.infer<typeof insertTaskSchema>;
export type Task = typeof tasks.$inferSelect;
export type TaskWithDetails = Task & {
  creatorName: string;
  assigneeName?: string;
};

export const taskSupportRequests = pgTable("task_support_requests", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  taskId: integer("task_id").notNull().references(() => tasks.id, { onDelete: "cascade" }),
  requesterId: integer("requester_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  supporterId: integer("supporter_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  message: text("message"),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

const _baseSupportRequestSchema = createInsertSchema(taskSupportRequests, {});

export const insertSupportRequestSchema = _baseSupportRequestSchema.omit({
  // @ts-ignore - drizzle-zod type inference issue
  id: true,
  // @ts-ignore - drizzle-zod type inference issue
  createdAt: true,
});

export type InsertSupportRequest = z.infer<typeof insertSupportRequestSchema>;
export type SupportRequest = typeof taskSupportRequests.$inferSelect;

export const worksheetPriorityEnum = z.enum(["low", "medium", "high", "urgent"]);
export type WorksheetPriority = z.infer<typeof worksheetPriorityEnum>;

export const dailyWorksheets = pgTable("daily_worksheets", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  date: timestamp("date").notNull(),
  todos: text("todos").notNull().default("[]"),
  hourlyLogs: text("hourly_logs").notNull().default("[]"),
  status: text("status").notNull().default("in_progress"),
  submittedAt: timestamp("submitted_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

const _baseDailyWorksheetSchema = createInsertSchema(dailyWorksheets, {
  date: z.string().transform((val) => new Date(val)),
});

export const insertDailyWorksheetSchema = _baseDailyWorksheetSchema.omit({
  // @ts-ignore - drizzle-zod type inference issue
  id: true,
  // @ts-ignore - drizzle-zod type inference issue
  createdAt: true,
  // @ts-ignore - drizzle-zod type inference issue
  updatedAt: true,
});

export type InsertDailyWorksheet = z.infer<typeof insertDailyWorksheetSchema>;
export type DailyWorksheet = typeof dailyWorksheets.$inferSelect;

export interface WorksheetTodo {
  id: string;
  text: string;
  priority: WorksheetPriority;
  completed: boolean;
}

export interface HourlyLog {
  hour: number;
  activity: string;
}

export interface DailyWorksheetWithDetails extends DailyWorksheet {
  userName: string;
  parsedTodos: WorksheetTodo[];
  parsedHourlyLogs: HourlyLog[];
}

export const projectStatusEnum = z.enum(["not_started", "in_progress", "on_hold", "completed", "delayed"]);
export type ProjectStatus = z.infer<typeof projectStatusEnum>;

export const projectPriorityEnum = z.enum(["low", "medium", "high"]);
export type ProjectPriority = z.infer<typeof projectPriorityEnum>;

export const projects = pgTable("projects", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  projectId: text("project_id").notNull().unique(),
  projectName: text("project_name").notNull(),
  description: text("description"),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  actualEndDate: timestamp("actual_end_date"),
  status: text("status").notNull().default("not_started"),
  progress: integer("progress").notNull().default(0),
  responsiblePersonId: integer("responsible_person_id").notNull().references(() => users.id),
  supportTeam: text("support_team"),
  tasksToDo: text("tasks_to_do"),
  issues: text("issues"),
  dependencies: text("dependencies"),
  nextSteps: text("next_steps"),
  targetCompletionDate: timestamp("target_completion_date"),
  remarks: text("remarks"),
  attachmentUrl: text("attachment_url"),
  priority: text("priority").notNull().default("medium"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

const _baseProjectSchema = createInsertSchema(projects, {
  projectName: z.string().min(1, "Project name is required"),
  projectId: z.string().optional(),
  startDate: z.string().transform((val) => new Date(val)),
  endDate: z.string().transform((val) => new Date(val)),
  actualEndDate: z.string().optional().transform((val) => val ? new Date(val) : undefined),
  targetCompletionDate: z.string().optional().transform((val) => val ? new Date(val) : undefined),
  status: projectStatusEnum.default("not_started"),
  priority: projectPriorityEnum.default("medium"),
  progress: z.number().min(0).max(100).default(0),
});

export const insertProjectSchema = _baseProjectSchema.omit({
  // @ts-ignore - drizzle-zod type inference issue
  id: true,
  // @ts-ignore - drizzle-zod type inference issue
  createdAt: true,
  // @ts-ignore - drizzle-zod type inference issue
  updatedAt: true,
}).extend({
  projectId: z.string().optional(),
});

export type InsertProject = z.infer<typeof insertProjectSchema>;
export type Project = typeof projects.$inferSelect;
export type ProjectWithDetails = Project & {
  responsiblePersonName: string;
  duration: number;
  statusColor: 'green' | 'yellow' | 'red';
};
