import { sql } from "drizzle-orm";
import { pgTable, text, varchar, boolean, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const userRoleEnum = z.enum(["admin", "user"]);
export type UserRole = z.infer<typeof userRoleEnum>;

export const taskStatusEnum = z.enum(["pending", "in_progress", "completed", "cancelled"]);
export type TaskStatus = z.infer<typeof taskStatusEnum>;

export const users = pgTable("users", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  name: text("name").notNull(),
  loginId: text("login_id").notNull().unique(),
  email: text("email"),
  password: text("password").notNull(),
  role: text("role").notNull().default("user"),
  avatar: text("avatar"),
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

export const messages = pgTable("messages", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  conversationId: integer("conversation_id").notNull().references(() => conversations.id, { onDelete: "cascade" }),
  senderId: integer("sender_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  body: text("body"),
  attachmentUrl: text("attachment_url"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

const _baseMessageSchema = createInsertSchema(messages, {});

export const insertMessageSchema = _baseMessageSchema.omit({
  // @ts-ignore - drizzle-zod type inference issue
  id: true,
  // @ts-ignore - drizzle-zod type inference issue
  createdAt: true,
});

export type InsertMessage = z.infer<typeof insertMessageSchema>;
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
  createdBy: integer("created_by").notNull().references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

const _baseMeetingSchema = createInsertSchema(meetings, {
  startTime: z.string().transform((val) => new Date(val)),
  endTime: z.string().transform((val) => new Date(val)),
  recurrencePattern: recurrencePatternEnum.default("none"),
  recurrenceEndDate: z.string().optional().nullable().refine((val) => !val || !isNaN(Date.parse(val)), {
    message: "Recurrence end date must be a valid date string",
  }).transform((val) => val ? new Date(val) : null),
  meetingLink: z.string().optional().refine(
    (link) => !link || link.startsWith('https://meet.jit.si/'),
    { message: 'Meeting link must be a Jitsi Meet URL (https://meet.jit.si/...)' }
  ),
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
  remark: text("remark"),
  createdBy: integer("created_by").notNull().references(() => users.id, { onDelete: "cascade" }),
  assignedTo: integer("assigned_to").references(() => users.id, { onDelete: "set null" }),
  conversationId: integer("conversation_id").references(() => conversations.id, { onDelete: "set null" }),
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
