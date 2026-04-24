import { Router } from 'express';
import bcrypt from 'bcrypt';
import { prisma } from '../index';
import { authenticateJWT, getJwtUser } from '../middlewares/auth';
import { requireTenant } from '../middlewares/tenant';

const router = Router();
router.use(authenticateJWT);
router.use(requireTenant);

const USER_SELECT = { id: true, email: true, name: true, role: true, avatarUrl: true, createdAt: true };

router.get('/', async (req, res) => {
  const u = getJwtUser(req);
  try {
    const users = await prisma.user.findMany({ where: { organizationId: u.organizationId }, select: USER_SELECT, orderBy: { createdAt: 'asc' } });
    res.json(users);
  } catch { res.status(500).json({ error: 'Failed to fetch users' }); }
});

router.post('/invite', async (req, res) => {
  const u = getJwtUser(req);
  if (u.role !== 'ADMIN') return res.status(403).json({ error: 'Forbidden: Admins only' });
  const { email, name, role } = req.body;
  if (!email) return res.status(400).json({ error: 'email is required' });
  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      if (existing.organizationId === u.organizationId) return res.status(400).json({ error: 'User already in your organization' });
      return res.status(400).json({ error: 'Email already registered in another organization' });
    }
    const tempPassword = Math.random().toString(36).slice(-10) + 'Aa1!';
    const hashedPassword = await bcrypt.hash(tempPassword, 10);
    const user = await prisma.user.create({
      data: { email, name: name || email.split('@')[0], password: hashedPassword, organizationId: u.organizationId, role: role === 'ADMIN' ? 'ADMIN' : 'MEMBER' },
      select: USER_SELECT,
    });
    res.status(201).json({ user, tempPassword, message: `User invited. Temporary password: ${tempPassword}` });
  } catch (error) { console.error(error); res.status(500).json({ error: 'Failed to invite user' }); }
});

router.patch('/:id/role', async (req, res) => {
  const u = getJwtUser(req);
  if (u.role !== 'ADMIN') return res.status(403).json({ error: 'Forbidden: Admins only' });
  if (req.params.id === u.id) return res.status(400).json({ error: 'Cannot change your own role' });
  const { role } = req.body;
  if (!['ADMIN', 'MEMBER'].includes(role)) return res.status(400).json({ error: 'Invalid role' });
  try {
    const target = await prisma.user.findFirst({ where: { id: req.params.id, organizationId: u.organizationId } });
    if (!target) return res.status(404).json({ error: 'User not found in your organization' });
    const updated = await prisma.user.update({ where: { id: req.params.id }, data: { role }, select: USER_SELECT });
    res.json(updated);
  } catch { res.status(500).json({ error: 'Failed to update role' }); }
});

router.delete('/:id', async (req, res) => {
  const u = getJwtUser(req);
  if (u.role !== 'ADMIN') return res.status(403).json({ error: 'Forbidden: Admins only' });
  if (req.params.id === u.id) return res.status(400).json({ error: 'Cannot remove yourself' });
  try {
    const target = await prisma.user.findFirst({ where: { id: req.params.id, organizationId: u.organizationId } });
    if (!target) return res.status(404).json({ error: 'User not found in your organization' });
    await prisma.task.updateMany({ where: { assigneeId: req.params.id }, data: { assigneeId: null } });
    await prisma.user.update({ where: { id: req.params.id }, data: { email: `removed_${req.params.id}@removed.invalid`, name: '[Removed]' } });
    res.json({ message: 'User removed from organization' });
  } catch (error) { console.error(error); res.status(500).json({ error: 'Failed to remove user' }); }
});

export default router;
