import { Router } from 'express';
import { prisma } from '../index';
import { authenticateJWT, getJwtUser } from '../middlewares/auth';
import { requireTenant } from '../middlewares/tenant';

const router = Router();
router.use(authenticateJWT);
router.use(requireTenant);

router.get('/me', async (req, res) => {
  const u = getJwtUser(req);
  try {
    const org = await prisma.organization.findUnique({
      where: { id: u.organizationId },
      include: { _count: { select: { users: true, tasks: true } } },
    });
    if (!org) return res.status(404).json({ error: 'Organization not found' });
    res.json(org);
  } catch { res.status(500).json({ error: 'Failed to fetch organization' }); }
});

export default router;
