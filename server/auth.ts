import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { storage, type QueryContext } from './storage';

if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable must be set');
}

const JWT_SECRET = process.env.JWT_SECRET;
const SALT_ROUNDS = 10;

export interface AuthRequest extends Request {
  userId?: number;
  companyId?: number | null;
  isSuperAdmin?: boolean;
  queryContext?: QueryContext;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function generateToken(userId: number, companyId: number | null, role: string): string {
  return jwt.sign({ 
    userId, 
    companyId,
    isSuperAdmin: role === 'super_admin'
  }, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): { userId: number; companyId: number | null; isSuperAdmin: boolean } | null {
  try {
    const payload = jwt.verify(token, JWT_SECRET) as { userId: number; companyId: number | null; isSuperAdmin: boolean };
    return payload;
  } catch (error) {
    return null;
  }
}

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = authHeader.substring(7);
  const payload = verifyToken(token);

  if (!payload) {
    return res.status(401).json({ error: 'Invalid token' });
  }

  req.userId = payload.userId;
  req.companyId = payload.companyId;
  req.isSuperAdmin = payload.isSuperAdmin;
  req.queryContext = {
    companyId: payload.companyId,
    isSuperAdmin: payload.isSuperAdmin
  };
  next();
}

export async function getCurrentUser(req: AuthRequest, res: Response) {
  if (!req.userId || !req.queryContext) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const user = await storage.getUserById(req.queryContext, req.userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  const { password, ...userWithoutPassword } = user;
  res.json(userWithoutPassword);
}

export async function requireAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.userId || !req.queryContext) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const user = await storage.getUserById(req.queryContext, req.userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  if (user.role !== 'admin' && user.role !== 'super_admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  next();
}

export async function requireSuperAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.userId || !req.queryContext) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  if (!req.isSuperAdmin) {
    return res.status(403).json({ error: 'Super admin access required' });
  }

  next();
}
