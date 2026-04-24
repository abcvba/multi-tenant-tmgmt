import { Request, Response, NextFunction } from 'express';
import { getJwtUser } from './auth';

export const requireTenant = (req: Request, res: Response, next: NextFunction) => {
  const u = getJwtUser(req);
  if (!u || !u.organizationId) {
    return res.status(403).json({ error: 'Tenant context missing' });
  }
  next();
};
