import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { hashPassword, comparePassword, generateToken, authMiddleware, getCurrentUser, type AuthRequest, verifyToken } from "./auth";
import { insertUserSchema, insertConversationSchema, insertMessageSchema } from "@shared/schema";
import { z } from "zod";
import { upload, getFileUrl } from "./upload";
import { WebSocketServer, WebSocket } from "ws";

interface WebSocketClient extends WebSocket {
  userId?: number;
  isAlive?: boolean;
}

export async function registerRoutes(app: Express): Promise<Server> {
  app.post("/api/auth/register", async (req, res) => {
    try {
      const validation = insertUserSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: "Invalid input", details: validation.error });
      }

      const { name, email, password, avatar } = validation.data;

      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ error: "Email already registered" });
      }

      const hashedPassword = await hashPassword(password);
      const user = await storage.createUser({
        name,
        email,
        password: hashedPassword,
        avatar,
      });

      const token = generateToken(user.id);
      const { password: _, ...userWithoutPassword } = user;

      res.status(201).json({
        user: userWithoutPassword,
        token,
      });
    } catch (error) {
      console.error("Register error:", error);
      res.status(500).json({ error: "Registration failed" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: "Email and password required" });
      }

      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const isPasswordValid = await comparePassword(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

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
