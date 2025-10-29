import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { hashPassword, comparePassword, generateToken, authMiddleware, getCurrentUser, requireAdmin, type AuthRequest, verifyToken } from "./auth";
import { insertUserSchema, insertConversationSchema, insertMessageSchema, insertMeetingSchema } from "@shared/schema";
import { z } from "zod";
import { upload, getFileUrl } from "./upload";
import { WebSocketServer, WebSocket } from "ws";

interface WebSocketClient extends WebSocket {
  userId?: number;
  isAlive?: boolean;
}

export async function registerRoutes(app: Express): Promise<Server> {
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

      const { name, loginId, email, password, avatar, role } = validation.data;

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
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      console.error("Admin create user error:", error);
      res.status(500).json({ error: "Failed to create user" });
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

      const allMemberIds = [...new Set([req.userId, ...memberIds])];
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

      const messages = await storage.getMessagesByConversationId(conversationId);
      
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
      
      const meetingsWithCreatorInfo = await Promise.all(
        meetings.map(async (meeting) => {
          const creator = await storage.getUserById(meeting.createdBy);
          return {
            ...meeting,
            creatorName: creator?.name || 'Unknown',
          };
        })
      );

      res.json(meetingsWithCreatorInfo);
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

      const validation = insertMeetingSchema.safeParse({
        ...req.body,
        createdBy: req.userId,
      });

      if (!validation.success) {
        return res.status(400).json({ error: "Invalid input", details: validation.error });
      }

      const meeting = await storage.createMeeting(validation.data);
      const creator = await storage.getUserById(meeting.createdBy);

      res.status(201).json({
        ...meeting,
        creatorName: creator?.name || 'Unknown',
      });
    } catch (error) {
      console.error("Create meeting error:", error);
      res.status(500).json({ error: "Failed to create meeting" });
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

  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

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
