import { sql } from "drizzle-orm";
import { pgTable, text, varchar, boolean, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const userRoleEnum = z.enum(["admin", "user"]);
export type UserRole = z.infer<typeof userRoleEnum>;

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

export const conversationMembers = pgTable("conversation_members", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  conversationId: integer("conversation_id").notNull().references(() => conversations.id, { onDelete: "cascade" }),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  joinedAt: timestamp("joined_at").notNull().defaultNow(),
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

export const meetings = pgTable("meetings", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  title: text("title").notNull(),
  description: text("description"),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time").notNull(),
  meetingLink: text("meeting_link"),
  createdBy: integer("created_by").notNull().references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

const _baseMeetingSchema = createInsertSchema(meetings, {
  startTime: z.string().transform((val) => new Date(val)),
  endTime: z.string().transform((val) => new Date(val)),
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
