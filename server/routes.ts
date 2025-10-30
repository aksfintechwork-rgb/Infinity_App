import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { hashPassword, comparePassword, generateToken, authMiddleware, getCurrentUser, requireAdmin, type AuthRequest, verifyToken } from "./auth";
import { insertUserSchema, insertConversationSchema, insertMessageSchema, insertMeetingSchema, insertTaskSchema, insertSupportRequestSchema } from "@shared/schema";
import { z } from "zod";
import { upload, getFileUrl } from "./upload";
import { WebSocketServer, WebSocket } from "ws";
import { generateMeetingSummary } from "./openai";

interface WebSocketClient extends WebSocket {
  userId?: number;
  isAlive?: boolean;
}

export async function registerRoutes(app: Express): Promise<Server> {
  // WebSocket server will be assigned after HTTP server is created
  let wss: WebSocketServer | null = null;

  // Helper function to broadcast user list updates
  const broadcastUserListUpdate = (type: 'user_created' | 'user_deleted', userData: any) => {
    if (!wss) return;
    wss.clients.forEach((client: WebSocketClient) => {
      if (client.readyState === WebSocket.OPEN && client.userId) {
        client.send(JSON.stringify({ type, data: userData }));
      }
    });
  };

  // Helper function to broadcast task updates (only to authorized users)
  const broadcastTaskUpdate = (type: 'task_created' | 'task_updated' | 'task_deleted', taskData: any, authorizedUserIds: number[]) => {
    if (!wss) return;
    
    // Require non-empty authorized user IDs to prevent inadvertent broadcasts
    if (!authorizedUserIds || authorizedUserIds.length === 0) {
      console.error(`[SECURITY] Attempted to broadcast ${type} without authorized user IDs`);
      return;
    }
    
    wss.clients.forEach((client: WebSocketClient) => {
      if (client.readyState === WebSocket.OPEN && client.userId) {
        // Only send to users in the authorized list (creator and/or assignee)
        if (authorizedUserIds.includes(client.userId)) {
          client.send(JSON.stringify({ type, data: taskData }));
        }
      }
    });
  };

  // One-time setup endpoint - creates initial admin user only if database is empty
  app.post("/api/setup/initialize", async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      if (users.length > 0) {
        return res.status(403).json({ error: "Setup already completed. Database has users." });
      }

      // Create initial admin user with default credentials
      const hashedPassword = await hashPassword("admin123");
      const adminUser = await storage.createUser({
        name: "Admin User",
        loginId: "admin",
        email: "admin@supremotraders.com",
        password: hashedPassword,
        role: "admin"
      });

      console.log(`[SETUP] ✅ Initial admin user created: ${adminUser.name} (loginId: ${adminUser.loginId})`);
      
      return res.json({ 
        success: true, 
        message: "Initial admin user created successfully",
        loginId: "admin",
        note: "Use loginId 'admin' with password 'admin123' to login"
      });
    } catch (error: any) {
      console.error("[SETUP] ❌ Setup failed:", error);
      return res.status(500).json({ error: "Setup failed", details: error.message });
    }
  });

  // Public registration disabled - only admins can create users via /api/admin/users
  app.post("/api/auth/register", async (req, res) => {
    return res.status(403).json({ error: "Public registration is disabled. Please contact your administrator for an account." });
  });

  app.post("/api/auth/login", async (req, res) => {
    // Set no-cache headers to prevent browser caching
    res.set({
      'Cache-Control': 'no-store, no-cache, must-revalidate, private',
      'Pragma': 'no-cache',
      'Expires': '0'
    });

    try {
      // Mobile-safe input normalization: NFKC normalization + hidden char removal
      const nfkc = (s: string) => (s || "").normalize("NFKC");
      const sanitize = (s: string) => nfkc(s).replace(/[\u0000-\u001F\u007F\u200B\u00A0]/g, "").trim();

      const rawLoginId = req.body.loginId;
      const rawPassword = req.body.password;

      if (!rawLoginId || !rawPassword) {
        console.log(`[LOGIN] ❌ Missing credentials - loginId: "${rawLoginId || 'EMPTY'}", password length: ${rawPassword?.length || 0}`);
        return res.status(400).json({ error: "Login ID and password required" });
      }

      // Normalize and sanitize loginId (remove hidden chars, trim)
      // Normalize password (NFKC only, preserve actual spaces)
      const loginId = sanitize(rawLoginId);
      const password = nfkc(rawPassword);

      // Log any normalization differences for debugging
      if (rawLoginId !== loginId) {
        console.log(`[LOGIN] 🧹 LoginID normalized: "${rawLoginId}" → "${loginId}" (removed ${rawLoginId.length - loginId.length} hidden chars)`);
      }
      if (rawPassword !== password) {
        console.log(`[LOGIN] 🧹 Password normalized (length: ${rawPassword.length} → ${password.length})`);
      }

      console.log(`[LOGIN] 🔍 Attempting login for loginId: "${loginId}" (length: ${loginId.length}, password length: ${password.length})`);
      const user = await storage.getUserByLoginId(loginId);
      if (!user) {
        console.log(`[LOGIN] ❌ User not found for loginId: "${loginId}"`);
        return res.status(401).json({ error: "Invalid credentials" });
      }

      console.log(`[LOGIN] ✓ User found: "${user.name}" (loginId: "${user.loginId}")`);
      console.log(`[LOGIN] 🔐 Comparing passwords... (submitted password length: ${password.length})`);
      const isPasswordValid = await comparePassword(password, user.password);
      if (!isPasswordValid) {
        console.log(`[LOGIN] ❌ Invalid password for user: "${user.name}" (expected length should be 10 for standard passwords)`);
        return res.status(401).json({ error: "Invalid credentials" });
      }
      console.log(`[LOGIN] ✅ Successful login for user: "${user.name}"`);


      const token = generateToken(user.id);
      const { password: _, ...userWithoutPassword } = user;

      res.json({
        user: userWithoutPassword,
        token,
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ error: "Login failed" });
    }
  });

  app.get("/api/auth/me", authMiddleware, getCurrentUser);

  app.get("/api/profile", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const userId = req.userId!;
      const user = await storage.getUserById(userId);
      
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const { password, ...userProfile } = user;
      res.json(userProfile);
    } catch (error) {
      console.error("Get profile error:", error);
      res.status(500).json({ error: "Failed to fetch profile" });
    }
  });

  app.post("/api/auth/change-password", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        return res.status(400).json({ error: "Current password and new password are required" });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({ error: "New password must be at least 6 characters long" });
      }

      const userId = req.userId!;
      const user = await storage.getUserById(userId);
      
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const isCurrentPasswordValid = await comparePassword(currentPassword, user.password);
      if (!isCurrentPasswordValid) {
        return res.status(401).json({ error: "Current password is incorrect" });
      }

      const hashedNewPassword = await hashPassword(newPassword);
      await storage.updateUserPassword(userId, hashedNewPassword);

      console.log(`[PASSWORD CHANGE] ✅ Password changed successfully for user: ${user.name} (ID: ${userId})`);
      
      res.json({ success: true, message: "Password changed successfully" });
    } catch (error) {
      console.error("Password change error:", error);
      res.status(500).json({ error: "Failed to change password" });
    }
  });

  app.get("/api/users", authMiddleware, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      const usersWithoutPasswords = users.map(({ password, ...user }) => user);
      res.json(usersWithoutPasswords);
    } catch (error) {
      console.error("Get users error:", error);
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });

  app.get("/api/admin/users", authMiddleware, requireAdmin, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      const usersWithoutPasswords = users.map(({ password, ...user }) => user);
      res.json(usersWithoutPasswords);
    } catch (error) {
      console.error("Admin get users error:", error);
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });

  app.post("/api/admin/users", authMiddleware, requireAdmin, async (req, res) => {
    try {
      const validation = insertUserSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: "Invalid input", details: validation.error });
      }

      const { name, loginId, email, password, avatar, role } = validation.data as z.infer<typeof insertUserSchema>;

      const existingUser = await storage.getUserByLoginId(loginId);
      if (existingUser) {
        return res.status(400).json({ error: "Login ID already taken" });
      }

      const hashedPassword = await hashPassword(password);
      const user = await storage.createUser({
        name,
        loginId,
        email,
        password: hashedPassword,
        role: role || "user",
        avatar,
      });

      const { password: _, ...userWithoutPassword } = user;
      
      // Broadcast user creation to all connected clients
      broadcastUserListUpdate('user_created', userWithoutPassword);
      
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      console.error("Admin create user error:", error);
      res.status(500).json({ error: "Failed to create user" });
    }
  });

  app.delete("/api/admin/users/:userId", authMiddleware, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const userId = parseInt(req.params.userId);
      
      if (isNaN(userId)) {
        return res.status(400).json({ error: "Invalid user ID" });
      }

      // Prevent admin from deleting themselves
      if (userId === req.userId) {
        return res.status(400).json({ error: "Cannot delete your own account" });
      }

      const user = await storage.getUserById(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      await storage.deleteUser(userId);
      
      // Broadcast user deletion to all connected clients
      broadcastUserListUpdate('user_deleted', { id: userId });
      
      res.json({ message: "User deleted successfully" });
    } catch (error) {
      console.error("Admin delete user error:", error);
      res.status(500).json({ error: "Failed to delete user" });
    }
  });

  app.get("/api/conversations", authMiddleware, async (req: AuthRequest, res) => {
    try {
      if (!req.userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const conversations = await storage.getConversationsByUserId(req.userId);
      
      const conversationsWithDetails = await Promise.all(
        conversations.map(async (conv) => {
          const members = await storage.getConversationMembers(conv.id);
          const lastMessage = await storage.getLastMessageByConversationId(conv.id);
          
          const otherMembers = members.filter(m => m.id !== req.userId);
          const memberNames = otherMembers.map(m => m.name.split(' ')[0]).join(', ');
          
          return {
            ...conv,
            members: memberNames,
            memberIds: members.map(m => m.id),
            memberCount: members.length,
            lastMessage: lastMessage?.body || undefined,
            lastMessageTime: lastMessage?.createdAt || undefined,
          };
        })
      );

      res.json(conversationsWithDetails);
    } catch (error) {
      console.error("Get conversations error:", error);
      res.status(500).json({ error: "Failed to fetch conversations" });
    }
  });

  app.post("/api/conversations", authMiddleware, async (req: AuthRequest, res) => {
    try {
      if (!req.userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const { title, memberIds } = req.body;

      if (!memberIds || !Array.isArray(memberIds) || memberIds.length === 0) {
        return res.status(400).json({ error: "Member IDs required" });
      }

      const allMemberIds = Array.from(new Set([req.userId, ...memberIds]));
      const isGroup = allMemberIds.length > 2;

      const conversation = await storage.createConversation({
        title: isGroup ? title : undefined,
        isGroup,
      });

      for (const memberId of allMemberIds) {
        await storage.addConversationMember({
          conversationId: conversation.id,
          userId: memberId,
        });
      }

      const members = await storage.getConversationMembers(conversation.id);
      const otherMembers = members.filter(m => m.id !== req.userId);
      const memberNames = otherMembers.map(m => m.name.split(' ')[0]).join(', ');

      res.status(201).json({
        ...conversation,
        members: memberNames,
        memberCount: members.length,
      });
    } catch (error) {
      console.error("Create conversation error:", error);
      res.status(500).json({ error: "Failed to create conversation" });
    }
  });

  app.post("/api/conversations/:id/members", authMiddleware, async (req: AuthRequest, res) => {
    try {
      if (!req.userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const conversationId = parseInt(req.params.id);
      if (isNaN(conversationId)) {
        return res.status(400).json({ error: "Invalid conversation ID" });
      }

      const { memberIds, canViewHistory = false } = req.body;

      if (!memberIds || !Array.isArray(memberIds) || memberIds.length === 0) {
        return res.status(400).json({ error: "Member IDs required" });
      }

      const userConvIds = await storage.getUserConversationIds(req.userId);
      if (!userConvIds.includes(conversationId)) {
        return res.status(403).json({ error: "Access denied - you are not a member of this conversation" });
      }

      const conversation = await storage.getConversationById(conversationId);
      if (!conversation?.isGroup) {
        return res.status(400).json({ error: "Cannot add members to direct messages" });
      }

      const existingMembers = await storage.getConversationMembers(conversationId);
      const existingMemberIds = existingMembers.map(m => m.id);

      const newMemberIds = memberIds.filter((id: number) => !existingMemberIds.includes(id));

      for (const memberId of newMemberIds) {
        await storage.addConversationMemberWithHistory({
          conversationId,
          userId: memberId,
          canViewHistory: canViewHistory === true,
        });
      }

      const updatedMembers = await storage.getConversationMembers(conversationId);
      const memberNames = updatedMembers.map(m => m.name.split(' ')[0]).join(', ');

      res.status(201).json({
        success: true,
        addedCount: newMemberIds.length,
        members: memberNames,
        memberCount: updatedMembers.length,
      });
    } catch (error) {
      console.error("Add members error:", error);
      res.status(500).json({ error: "Failed to add members" });
    }
  });

  app.get("/api/pinned-conversations", authMiddleware, async (req: AuthRequest, res) => {
    try {
      if (!req.userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const pinnedConversationIds = await storage.getPinnedConversations(req.userId);
      res.json(pinnedConversationIds);
    } catch (error) {
      console.error("Get pinned conversations error:", error);
      res.status(500).json({ error: "Failed to get pinned conversations" });
    }
  });

  app.post("/api/conversations/:id/pin", authMiddleware, async (req: AuthRequest, res) => {
    try {
      if (!req.userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const conversationId = parseInt(req.params.id);
      if (isNaN(conversationId)) {
        return res.status(400).json({ error: "Invalid conversation ID" });
      }

      const userConvIds = await storage.getUserConversationIds(req.userId);
      if (!userConvIds.includes(conversationId)) {
        return res.status(403).json({ error: "Access denied - you are not a member of this conversation" });
      }

      const isPinned = await storage.isPinned(req.userId, conversationId);
      if (isPinned) {
        return res.status(400).json({ error: "Conversation is already pinned" });
      }

      const pinnedCount = await storage.countPinnedConversations(req.userId);
      if (pinnedCount >= 3) {
        return res.status(400).json({ error: "You can only pin up to 3 conversations. Please unpin one first." });
      }

      const pinned = await storage.pinConversation(req.userId, conversationId);
      res.status(201).json(pinned);
    } catch (error) {
      console.error("Pin conversation error:", error);
      res.status(500).json({ error: "Failed to pin conversation" });
    }
  });

  app.delete("/api/conversations/:id/unpin", authMiddleware, async (req: AuthRequest, res) => {
    try {
      if (!req.userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const conversationId = parseInt(req.params.id);
      if (isNaN(conversationId)) {
        return res.status(400).json({ error: "Invalid conversation ID" });
      }

      const isPinned = await storage.isPinned(req.userId, conversationId);
      if (!isPinned) {
        return res.status(400).json({ error: "Conversation is not pinned" });
      }

      await storage.unpinConversation(req.userId, conversationId);
      res.json({ success: true, message: "Conversation unpinned successfully" });
    } catch (error) {
      console.error("Unpin conversation error:", error);
      res.status(500).json({ error: "Failed to unpin conversation" });
    }
  });

  app.get("/api/conversations/:id/messages", authMiddleware, async (req: AuthRequest, res) => {
    try {
      if (!req.userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const conversationId = parseInt(req.params.id);
      if (isNaN(conversationId)) {
        return res.status(400).json({ error: "Invalid conversation ID" });
      }

      const userConvIds = await storage.getUserConversationIds(req.userId);
      if (!userConvIds.includes(conversationId)) {
        return res.status(403).json({ error: "Access denied" });
      }

      const memberInfo = await storage.getConversationMemberInfo(conversationId, req.userId);
      if (!memberInfo) {
        return res.status(403).json({ error: "You are not a member of this conversation" });
      }

      let messages = await storage.getMessagesByConversationId(conversationId);
      
      if (!memberInfo.canViewHistory && memberInfo.joinedAt) {
        messages = messages.filter(msg => new Date(msg.createdAt) >= new Date(memberInfo.joinedAt!));
      }

      const messagesWithSenderInfo = await Promise.all(
        messages.map(async (msg) => {
          const sender = await storage.getUserById(msg.senderId);
          return {
            ...msg,
            senderName: sender?.name || 'Unknown',
            senderAvatar: sender?.avatar,
          };
        })
      );

      res.json(messagesWithSenderInfo);
    } catch (error) {
      console.error("Get messages error:", error);
      res.status(500).json({ error: "Failed to fetch messages" });
    }
  });

  app.post("/api/messages", authMiddleware, async (req: AuthRequest, res) => {
    try {
      if (!req.userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const validation = insertMessageSchema.extend({
        conversationId: z.number(),
        senderId: z.number(),
      }).safeParse({
        ...req.body,
        senderId: req.userId,
      });

      if (!validation.success) {
        return res.status(400).json({ error: "Invalid input", details: validation.error });
      }

      const userConvIds = await storage.getUserConversationIds(req.userId);
      if (!userConvIds.includes(validation.data.conversationId)) {
        return res.status(403).json({ error: "Access denied" });
      }

      const message = await storage.createMessage(validation.data);
      const sender = await storage.getUserById(message.senderId);

      res.status(201).json({
        ...message,
        senderName: sender?.name || 'Unknown',
        senderAvatar: sender?.avatar,
      });
    } catch (error) {
      console.error("Create message error:", error);
      res.status(500).json({ error: "Failed to create message" });
    }
  });

  app.get("/api/meetings", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const meetings = await storage.getAllMeetings();
      
      const meetingsWithDetails = await Promise.all(
        meetings.map(async (meeting) => {
          const creator = await storage.getUserById(meeting.createdBy);
          const participants = await storage.getMeetingParticipants(meeting.id);
          return {
            ...meeting,
            creatorName: creator?.name || 'Unknown',
            participants: participants.map(p => ({ id: p.id, name: p.name })),
          };
        })
      );

      res.json(meetingsWithDetails);
    } catch (error) {
      console.error("Get meetings error:", error);
      res.status(500).json({ error: "Failed to fetch meetings" });
    }
  });

  app.post("/api/meetings", authMiddleware, async (req: AuthRequest, res) => {
    try {
      if (!req.userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const { participantIds, ...meetingData } = req.body;

      const validation = insertMeetingSchema.safeParse({
        ...meetingData,
        createdBy: req.userId,
      });

      if (!validation.success) {
        return res.status(400).json({ error: "Invalid input", details: validation.error });
      }

      const meeting = await storage.createMeeting(validation.data);
      
      // Add participants if provided
      if (participantIds && Array.isArray(participantIds)) {
        for (const userId of participantIds) {
          await storage.addMeetingParticipant({
            meetingId: meeting.id,
            userId: parseInt(userId),
          });
        }
      }

      const creator = await storage.getUserById(meeting.createdBy);
      const participants = await storage.getMeetingParticipants(meeting.id);

      res.status(201).json({
        ...meeting,
        creatorName: creator?.name || 'Unknown',
        participants: participants.map(p => ({ id: p.id, name: p.name })),
      });
    } catch (error) {
      console.error("Create meeting error:", error);
      res.status(500).json({ error: "Failed to create meeting" });
    }
  });

  app.post("/api/meetings/:id/generate-summary", authMiddleware, async (req: AuthRequest, res) => {
    try {
      if (!req.userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const meetingId = parseInt(req.params.id);
      const { language = 'en' } = req.body;

      const meeting = await storage.getMeetingById(meetingId);
      if (!meeting) {
        return res.status(404).json({ error: "Meeting not found" });
      }

      const summary = await generateMeetingSummary(
        meeting.title,
        meeting.description,
        language
      );

      await storage.updateMeetingSummary(meetingId, summary, language);

      const updatedMeeting = await storage.getMeetingById(meetingId);
      const creator = await storage.getUserById(updatedMeeting!.createdBy);
      const participants = await storage.getMeetingParticipants(meetingId);

      res.json({
        ...updatedMeeting,
        creatorName: creator?.name || 'Unknown',
        participants: participants.map(p => ({ id: p.id, name: p.name })),
      });
    } catch (error) {
      console.error("Generate summary error:", error);
      res.status(500).json({ error: "Failed to generate summary" });
    }
  });

  app.put("/api/meetings/:id", authMiddleware, async (req: AuthRequest, res) => {
    try {
      if (!req.userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const meetingId = parseInt(req.params.id);
      const meeting = await storage.getMeetingById(meetingId);

      if (!meeting) {
        return res.status(404).json({ error: "Meeting not found" });
      }

      const user = await storage.getUserById(req.userId);
      if (meeting.createdBy !== req.userId && user?.role !== 'admin') {
        return res.status(403).json({ error: "Only the creator or an admin can edit this meeting" });
      }

      const updateData = {
        ...req.body,
        id: meetingId,
        createdBy: meeting.createdBy,
        createdAt: meeting.createdAt,
      };

      await storage.updateMeeting(meetingId, updateData);
      
      if (req.body.participantIds !== undefined) {
        await storage.clearMeetingParticipants(meetingId);
        for (const userId of req.body.participantIds) {
          await storage.addMeetingParticipant(meetingId, userId);
        }
      }

      const updatedMeeting = await storage.getMeetingById(meetingId);
      const creator = await storage.getUserById(updatedMeeting!.createdBy);
      const participants = await storage.getMeetingParticipants(meetingId);

      res.json({
        ...updatedMeeting,
        creatorName: creator?.name || 'Unknown',
        participants: participants.map(p => ({ id: p.id, name: p.name })),
      });
    } catch (error) {
      console.error("Update meeting error:", error);
      res.status(500).json({ error: "Failed to update meeting" });
    }
  });

  app.delete("/api/meetings/:id", authMiddleware, async (req: AuthRequest, res) => {
    try {
      if (!req.userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const meetingId = parseInt(req.params.id);
      const meeting = await storage.getMeetingById(meetingId);

      if (!meeting) {
        return res.status(404).json({ error: "Meeting not found" });
      }

      const user = await storage.getUserById(req.userId);
      if (meeting.createdBy !== req.userId && user?.role !== 'admin') {
        return res.status(403).json({ error: "Only the creator or an admin can delete this meeting" });
      }

      await storage.deleteMeeting(meetingId);
      res.json({ message: "Meeting deleted successfully" });
    } catch (error) {
      console.error("Delete meeting error:", error);
      res.status(500).json({ error: "Failed to delete meeting" });
    }
  });

  // Task Management Routes
  app.post("/api/tasks", authMiddleware, async (req: AuthRequest, res) => {
    try {
      if (!req.userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const validation = insertTaskSchema.safeParse({
        ...req.body,
        createdBy: req.userId,
      });

      if (!validation.success) {
        return res.status(400).json({ error: "Invalid input", details: validation.error });
      }

      const task = await storage.createTask(validation.data);
      const taskDetails = await storage.getTaskById(task.id);
      
      if (!taskDetails) {
        return res.status(500).json({ error: "Failed to retrieve created task" });
      }
      
      // Collect authorized user IDs
      const authorizedUserIds = [taskDetails.createdBy];
      if (taskDetails.assignedTo) {
        authorizedUserIds.push(taskDetails.assignedTo);
      }
      
      broadcastTaskUpdate('task_created', taskDetails, authorizedUserIds);
      
      res.status(201).json(taskDetails);
    } catch (error) {
      console.error("Create task error:", error);
      res.status(500).json({ error: "Failed to create task" });
    }
  });

  app.get("/api/tasks", authMiddleware, async (req: AuthRequest, res) => {
    try {
      if (!req.userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const filter = req.query.filter as string | undefined;
      const userIdParam = req.query.userId as string | undefined;
      const user = await storage.getUserById(req.userId);
      const isAdmin = user?.role === 'admin';

      // Validate userId parameter if provided
      let filterUserId: number | undefined;
      if (userIdParam) {
        filterUserId = parseInt(userIdParam);
        if (isNaN(filterUserId)) {
          return res.status(400).json({ error: "Invalid userId parameter" });
        }
        // Only admins can filter by user ID
        if (!isAdmin) {
          return res.status(403).json({ error: "Only admins can filter by user ID" });
        }
      }

      let tasks;
      
      // Admins can filter by specific user
      if (isAdmin && filterUserId) {
        tasks = await storage.getAllTasksForUser(filterUserId);
      }
      // Admins can see all tasks
      else if (isAdmin && filter === 'all') {
        tasks = await storage.getAllTasks();
      } else if (filter === 'created') {
        tasks = await storage.getTasksByCreator(req.userId);
      } else if (filter === 'assigned') {
        tasks = await storage.getTasksByAssignee(req.userId);
      } else {
        // Default: show tasks user is involved in (creator or assignee)
        tasks = await storage.getAllTasksForUser(req.userId);
      }

      res.json(tasks);
    } catch (error) {
      console.error("Get tasks error:", error);
      res.status(500).json({ error: "Failed to fetch tasks" });
    }
  });

  app.get("/api/tasks/:id", authMiddleware, async (req: AuthRequest, res) => {
    try {
      if (!req.userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const taskId = parseInt(req.params.id);
      const task = await storage.getTaskById(taskId);

      if (!task) {
        return res.status(404).json({ error: "Task not found" });
      }

      const user = await storage.getUserById(req.userId);
      const isAdmin = user?.role === 'admin';

      // Admins can see all tasks, regular users only see tasks they're involved in
      if (!isAdmin && task.createdBy !== req.userId && task.assignedTo !== req.userId) {
        return res.status(403).json({ error: "You don't have access to this task" });
      }

      res.json(task);
    } catch (error) {
      console.error("Get task error:", error);
      res.status(500).json({ error: "Failed to fetch task" });
    }
  });

  app.patch("/api/tasks/:id", authMiddleware, async (req: AuthRequest, res) => {
    try {
      if (!req.userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const taskId = parseInt(req.params.id);
      const task = await storage.getTaskById(taskId);

      if (!task) {
        return res.status(404).json({ error: "Task not found" });
      }

      const user = await storage.getUserById(req.userId);
      const isAdmin = user?.role === 'admin';

      // Check permissions based on what's being updated
      const isCreatorOrAssignee = task.createdBy === req.userId || task.assignedTo === req.userId;
      
      // Admins can update assignedTo and remark
      // Creator/Assignee can update status and other fields
      if (!isAdmin && !isCreatorOrAssignee) {
        return res.status(403).json({ error: "You don't have permission to update this task" });
      }

      // Prepare update data
      let updateData: any = {};
      
      if (isAdmin) {
        // Admins can update assignedTo and remark
        if (req.body.assignedTo !== undefined) {
          updateData.assignedTo = req.body.assignedTo;
        }
        if (req.body.remark !== undefined) {
          updateData.remark = req.body.remark;
        }
      }
      
      if (isCreatorOrAssignee) {
        // Creator/Assignee can update status and other fields
        if (req.body.status !== undefined) {
          updateData.status = req.body.status;
        }
        if (req.body.title !== undefined) {
          updateData.title = req.body.title;
        }
        if (req.body.description !== undefined) {
          updateData.description = req.body.description;
        }
        if (req.body.startDate !== undefined) {
          updateData.startDate = req.body.startDate;
        }
        if (req.body.targetDate !== undefined) {
          updateData.targetDate = req.body.targetDate;
        }
      }

      const updatedTask = await storage.updateTask(taskId, updateData);
      const taskDetails = await storage.getTaskById(taskId);
      
      if (!taskDetails) {
        return res.status(500).json({ error: "Failed to retrieve updated task" });
      }
      
      // Collect authorized user IDs
      const authorizedUserIds = [taskDetails.createdBy];
      if (taskDetails.assignedTo) {
        authorizedUserIds.push(taskDetails.assignedTo);
      }
      
      broadcastTaskUpdate('task_updated', taskDetails, authorizedUserIds);
      
      res.json(taskDetails);
    } catch (error) {
      console.error("Update task error:", error);
      res.status(500).json({ error: "Failed to update task" });
    }
  });

  app.delete("/api/tasks/:id", authMiddleware, async (req: AuthRequest, res) => {
    try {
      if (!req.userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const taskId = parseInt(req.params.id);
      const task = await storage.getTaskById(taskId);

      if (!task) {
        return res.status(404).json({ error: "Task not found" });
      }

      // Only the creator can delete the task
      if (task.createdBy !== req.userId) {
        return res.status(403).json({ error: "Only the task creator can delete this task" });
      }

      // Collect authorized user IDs before deletion
      const authorizedUserIds = [task.createdBy];
      if (task.assignedTo) {
        authorizedUserIds.push(task.assignedTo);
      }

      await storage.deleteTask(taskId);
      
      broadcastTaskUpdate('task_deleted', { id: taskId }, authorizedUserIds);
      
      res.json({ message: "Task deleted successfully" });
    } catch (error) {
      console.error("Delete task error:", error);
      res.status(500).json({ error: "Failed to delete task" });
    }
  });

  app.post("/api/tasks/:id/support", authMiddleware, async (req: AuthRequest, res) => {
    try {
      if (!req.userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const taskId = parseInt(req.params.id);
      const { supporterId, message } = req.body;

      if (!supporterId) {
        return res.status(400).json({ error: "Supporter ID is required" });
      }

      const task = await storage.getTaskById(taskId);
      if (!task) {
        return res.status(404).json({ error: "Task not found" });
      }

      const validation = insertSupportRequestSchema.safeParse({
        taskId,
        requesterId: req.userId,
        supporterId,
        message,
        status: 'pending',
      });

      if (!validation.success) {
        return res.status(400).json({ error: "Invalid input", details: validation.error });
      }

      const supportRequest = await storage.createSupportRequest(validation.data);
      res.status(201).json(supportRequest);
    } catch (error) {
      console.error("Create support request error:", error);
      res.status(500).json({ error: "Failed to create support request" });
    }
  });

  app.get("/api/tasks/:id/support", authMiddleware, async (req: AuthRequest, res) => {
    try {
      if (!req.userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const taskId = parseInt(req.params.id);
      const supportRequests = await storage.getSupportRequestsByTask(taskId);
      
      res.json(supportRequests);
    } catch (error) {
      console.error("Get support requests error:", error);
      res.status(500).json({ error: "Failed to fetch support requests" });
    }
  });

  app.post("/api/upload", authMiddleware, upload.single('file'), async (req: AuthRequest, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const fileUrl = getFileUrl(req.file.filename);
      res.json({ url: fileUrl });
    } catch (error) {
      console.error("Upload error:", error);
      res.status(500).json({ error: "File upload failed" });
    }
  });

  const httpServer = createServer(app);

  wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  // Helper function to get currently online user IDs
  const getOnlineUserIds = (): number[] => {
    const onlineIds: number[] = [];
    wss.clients.forEach((client: WebSocketClient) => {
      if (client.readyState === WebSocket.OPEN && client.userId) {
        if (!onlineIds.includes(client.userId)) {
          onlineIds.push(client.userId);
        }
      }
    });
    return onlineIds;
  };

  // Helper function to broadcast user presence status
  const broadcastUserPresence = (userId: number, status: 'online' | 'offline') => {
    wss.clients.forEach((client: WebSocketClient) => {
      if (client.readyState === WebSocket.OPEN && client.userId) {
        client.send(JSON.stringify({
          type: status === 'online' ? 'user_online' : 'user_offline',
          data: { userId },
        }));
      }
    });
  };

  wss.on('connection', (ws: WebSocketClient, req) => {
    const url = new URL(req.url || '', `http://${req.headers.host}`);
    const token = url.searchParams.get('token');

    if (!token) {
      ws.close(1008, 'No token provided');
      return;
    }

    const payload = verifyToken(token);
    if (!payload) {
      ws.close(1008, 'Invalid token');
      return;
    }

    ws.userId = payload.userId;
    ws.isAlive = true;

    console.log(`WebSocket client connected: userId=${ws.userId}`);

    // Broadcast that this user is online
    broadcastUserPresence(ws.userId, 'online');

    // Send list of currently online users to the newly connected client
    const onlineUserIds = getOnlineUserIds();
    ws.send(JSON.stringify({
      type: 'online_users',
      data: { userIds: onlineUserIds },
    }));

    ws.on('pong', () => {
      ws.isAlive = true;
    });

    ws.on('message', async (data) => {
      try {
        const message = JSON.parse(data.toString());
        
        if (message.type === 'new_message') {
          const validation = insertMessageSchema.extend({
            conversationId: z.number(),
            senderId: z.number(),
          }).safeParse({
            ...message.data,
            senderId: ws.userId,
          });

          if (!validation.success) {
            ws.send(JSON.stringify({ type: 'error', error: 'Invalid message data' }));
            return;
          }

          const userConvIds = await storage.getUserConversationIds(ws.userId!);
          if (!userConvIds.includes(validation.data.conversationId)) {
            ws.send(JSON.stringify({ type: 'error', error: 'Access denied' }));
            return;
          }

          const newMessage = await storage.createMessage(validation.data);
          const sender = await storage.getUserById(newMessage.senderId);

          const messageWithSender = {
            ...newMessage,
            senderName: sender?.name || 'Unknown',
            senderAvatar: sender?.avatar,
          };

          const members = await storage.getConversationMembers(validation.data.conversationId);
          const memberIds = members.map(m => m.id);

          wss.clients.forEach((client: WebSocketClient) => {
            if (client.readyState === WebSocket.OPEN && 
                client.userId && 
                memberIds.includes(client.userId)) {
              client.send(JSON.stringify({
                type: 'new_message',
                data: messageWithSender,
              }));
            }
          });
        }

        if (message.type === 'typing') {
          const { conversationId, isTyping } = message.data;
          
          const userConvIds = await storage.getUserConversationIds(ws.userId!);
          if (!userConvIds.includes(conversationId)) {
            return;
          }

          const members = await storage.getConversationMembers(conversationId);
          const memberIds = members.map(m => m.id);
          const user = await storage.getUserById(ws.userId!);

          wss.clients.forEach((client: WebSocketClient) => {
            if (client.readyState === WebSocket.OPEN && 
                client.userId && 
                client.userId !== ws.userId &&
                memberIds.includes(client.userId)) {
              client.send(JSON.stringify({
                type: 'typing',
                data: {
                  conversationId,
                  userId: ws.userId,
                  userName: user?.name || 'Unknown',
                  isTyping,
                },
              }));
            }
          });
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
        ws.send(JSON.stringify({ type: 'error', error: 'Failed to process message' }));
      }
    });

    ws.on('close', () => {
      console.log(`WebSocket client disconnected: userId=${ws.userId}`);
      
      // Check if user still has other active connections
      const userId = ws.userId;
      if (userId) {
        let stillOnline = false;
        wss.clients.forEach((client: WebSocketClient) => {
          if (client !== ws && client.readyState === WebSocket.OPEN && client.userId === userId) {
            stillOnline = true;
          }
        });
        
        // Only broadcast offline if user has no other connections
        if (!stillOnline) {
          broadcastUserPresence(userId, 'offline');
        }
      }
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
    });
  });

  const heartbeat = setInterval(() => {
    wss.clients.forEach((ws: WebSocketClient) => {
      if (ws.isAlive === false) {
        return ws.terminate();
      }
      ws.isAlive = false;
      ws.ping();
    });
  }, 30000);

  wss.on('close', () => {
    clearInterval(heartbeat);
  });

  return httpServer;
}
