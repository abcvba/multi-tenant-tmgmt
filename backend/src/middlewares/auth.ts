import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface JwtPayload {
  id: string;
  role: string;
  organizationId: string;
  email: string;
  name?: string;
}

// Augment Express Request with our custom user type
declare module 'express-serve-static-core' {
  interface Request {
    jwtUser?: JwtPayload;
  }
}

export const authenticateJWT = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];

    jwt.verify(token, process.env.JWT_SECRET || 'supersecretjwtkey', (err, decoded) => {
      if (err) {
        return res.status(403).json({ error: 'Invalid or expired token' });
      }
      (req as any).jwtUser = decoded as JwtPayload;
      next();
    });
  } else {
    res.status(401).json({ error: 'Authorization token required' });
  }
};

export const requireRole = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const u = (req as any).jwtUser as JwtPayload | undefined;
    if (u && roles.includes(u.role)) {
      next();
    } else {
      res.status(403).json({ error: 'Forbidden: Insufficient permissions' });
    }
  };
};

// Helper to get the typed JWT user from a request
export function getJwtUser(req: Request): JwtPayload {
  return (req as any).jwtUser as JwtPayload;
}
