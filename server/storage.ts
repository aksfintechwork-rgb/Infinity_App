import { 
  type User, 
  type InsertUser,
  type Conversation,
  type InsertConversation,
  type Message,
  type InsertMessage,
  type ConversationMember,
  type InsertConversationMember,
  users,
  conversations,
  messages,
  conversationMembers,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, inArray } from "drizzle-orm";

export interface IStorage {
  getUserById(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getAllUsers(): Promise<User[]>;
  
  createConversation(conversation: InsertConversation): Promise<Conversation>;
  getConversationById(id: number): Promise<Conversation | undefined>;
  getConversationsByUserId(userId: number): Promise<Conversation[]>;
  
  addConversationMember(member: InsertConversationMember): Promise<ConversationMember>;
  getConversationMembers(conversationId: number): Promise<User[]>;
  getUserConversationIds(userId: number): Promise<number[]>;
  
  createMessage(message: InsertMessage): Promise<Message>;
  getMessagesByConversationId(conversationId: number): Promise<Message[]>;
  getLastMessageByConversationId(conversationId: number): Promise<Message | undefined>;
}

export class PostgresStorage implements IStorage {
  async getUserById(id: number): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
    return result[0];
  }

  async createUser(user: InsertUser): Promise<User> {
    const result = await db.insert(users).values(user).returning();
    return result[0];
  }

  async getAllUsers(): Promise<User[]> {
    return db.select().from(users);
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

  async addConversationMember(member: InsertConversationMember): Promise<ConversationMember> {
    const result = await db.insert(conversationMembers).values(member).returning();
    return result[0];
  }

  async getConversationMembers(conversationId: number): Promise<User[]> {
    const result = await db
      .select({
        id: users.id,
        name: users.name,
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

  async createMessage(message: InsertMessage): Promise<Message> {
    const result = await db.insert(messages).values(message).returning();
    return result[0];
  }

  async getMessagesByConversationId(conversationId: number): Promise<Message[]> {
    return db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, conversationId))
      .orderBy(messages.createdAt);
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
}

export const storage = new PostgresStorage();
