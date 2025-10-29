import { sql } from "drizzle-orm";
import { pgTable, text, varchar, boolean, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const userRoleEnum = z.enum(["admin", "user"]);
export type UserRole = z.infer<typeof userRoleEnum>;

export const users = pgTable("users", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  name: text("name").notNull(),
  loginId: text("login_id").unique(),
  email: text("email"),
  password: text("password").notNull(),
  role: text("role").notNull().default("user"),
  avatar: text("avatar"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertUserSchema = createInsertSchema(users)
  .omit({
    id: true,
    createdAt: true,
  })
  .extend({
    role: userRoleEnum.default("user"),
    loginId: z.string().min(3).max(32).regex(/^[a-zA-Z0-9_-]+$/, "Login ID can only contain letters, numbers, dashes, and underscores"),
  });

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export const conversations = pgTable("conversations", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  title: text("title"),
  isGroup: boolean("is_group").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertConversationSchema = createInsertSchema(conversations).omit({
  id: true,
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

export const insertConversationMemberSchema = createInsertSchema(conversationMembers).omit({
  id: true,
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

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  createdAt: true,
});

export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Message = typeof messages.$inferSelect;
