import { Router } from 'express';
import { prisma } from '../index';
import { authenticateJWT, getJwtUser } from '../middlewares/auth';
import { requireTenant } from '../middlewares/tenant';

const router = Router();
router.use(authenticateJWT);
router.use(requireTenant);

const logAudit = async (action: string, entityId: string, userId: string, taskId?: string, details?: any) => {
  await prisma.auditLog.create({
    data: { action, entity: 'Task', entityId, userId, taskId: taskId || null, details: details ? JSON.parse(JSON.stringify(details)) : null },
  });
};

const TASK_SELECT = {
  id: true, title: true, description: true, status: true, priority: true, dueDate: true,
  createdAt: true, updatedAt: true, organizationId: true, creatorId: true, assigneeId: true,
  creator: { select: { id: true, name: true, email: true, avatarUrl: true } },
  assignee: { select: { id: true, name: true, email: true, avatarUrl: true } },
};

router.get('/', async (req, res) => {
  const u = getJwtUser(req);
  try {
    const { status, priority, assigneeId, search } = req.query as Record<string, string>;
    const where: any = { organizationId: u.organizationId };
    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (assigneeId) where.assigneeId = assigneeId;
    if (search) where.OR = [{ title: { contains: search, mode: 'insensitive' } }, { description: { contains: search, mode: 'insensitive' } }];
    const tasks = await prisma.task.findMany({ where, select: TASK_SELECT, orderBy: [{ createdAt: 'desc' }] });
    res.json(tasks);
  } catch (error) { console.error(error); res.status(500).json({ error: 'Failed to fetch tasks' }); }
});

// Audit must come before /:id
router.get('/audit', async (req, res) => {
  const u = getJwtUser(req);
  try {
    if (u.role !== 'ADMIN') return res.status(403).json({ error: 'Forbidden: Admins only' });
    const logs = await prisma.auditLog.findMany({
      where: { user: { organizationId: u.organizationId } },
      include: { user: { select: { id: true, name: true, email: true, avatarUrl: true } }, task: { select: { id: true, title: true } } },
      orderBy: { createdAt: 'desc' }, take: 200,
    });
    res.json(logs);
  } catch { res.status(500).json({ error: 'Failed to fetch audit logs' }); }
});

router.get('/:id', async (req, res) => {
  const u = getJwtUser(req);
  try {
    const task = await prisma.task.findFirst({ where: { id: req.params.id, organizationId: u.organizationId }, select: TASK_SELECT });
    if (!task) return res.status(404).json({ error: 'Task not found' });
    res.json(task);
  } catch { res.status(500).json({ error: 'Failed to fetch task' }); }
});

router.post('/', async (req, res) => {
  const u = getJwtUser(req);
  const { title, description, status, priority, dueDate, assigneeId } = req.body;
  if (!title) return res.status(400).json({ error: 'Title is required' });
  try {
    if (assigneeId) {
      const assignee = await prisma.user.findFirst({ where: { id: assigneeId, organizationId: u.organizationId } });
      if (!assignee) return res.status(400).json({ error: 'Assignee not in organization' });
    }
    const task = await prisma.task.create({
      data: { title, description, status: status || 'TODO', priority: priority || 'MEDIUM', dueDate: dueDate ? new Date(dueDate) : null, organizationId: u.organizationId, creatorId: u.id, assigneeId: assigneeId || null },
      select: TASK_SELECT,
    });
    await logAudit('TASK_CREATED', task.id, u.id, task.id, { title: task.title, status: task.status, priority: task.priority });
    res.status(201).json(task);
  } catch (error) { console.error(error); res.status(500).json({ error: 'Failed to create task' }); }
});

router.put('/:id', async (req, res) => {
  const u = getJwtUser(req);
  const { id } = req.params;
  const { title, description, status, priority, dueDate, assigneeId } = req.body;
  try {
    const task = await prisma.task.findFirst({ where: { id, organizationId: u.organizationId } });
    if (!task) return res.status(404).json({ error: 'Task not found' });
    if (u.role === 'MEMBER' && task.creatorId !== u.id) return res.status(403).json({ error: 'Forbidden: Cannot edit others\' tasks' });
    if (assigneeId) {
      const assignee = await prisma.user.findFirst({ where: { id: assigneeId, organizationId: u.organizationId } });
      if (!assignee) return res.status(400).json({ error: 'Assignee not in organization' });
    }
    const updated = await prisma.task.update({
      where: { id },
      data: { ...(title !== undefined && { title }), ...(description !== undefined && { description }), ...(status !== undefined && { status }), ...(priority !== undefined && { priority }), ...(dueDate !== undefined && { dueDate: dueDate ? new Date(dueDate) : null }), ...(assigneeId !== undefined && { assigneeId: assigneeId || null }) },
      select: TASK_SELECT,
    });
    await logAudit('TASK_UPDATED', id, u.id, id, { title: updated.title, status: updated.status, priority: updated.priority });
    res.json(updated);
  } catch (error) { console.error(error); res.status(500).json({ error: 'Failed to update task' }); }
});

router.delete('/:id', async (req, res) => {
  const u = getJwtUser(req);
  const { id } = req.params;
  try {
    const task = await prisma.task.findFirst({ where: { id, organizationId: u.organizationId } });
    if (!task) return res.status(404).json({ error: 'Task not found' });
    if (u.role === 'MEMBER' && task.creatorId !== u.id) return res.status(403).json({ error: 'Forbidden: Cannot delete others\' tasks' });
    await logAudit('TASK_DELETED', id, u.id, undefined, { title: task.title });
    await prisma.auditLog.updateMany({ where: { taskId: id }, data: { taskId: null } });
    await prisma.task.delete({ where: { id } });
    res.json({ message: 'Task deleted successfully' });
  } catch (error) { console.error(error); res.status(500).json({ error: 'Failed to delete task' }); }
});

export default router;
