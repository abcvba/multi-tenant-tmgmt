import { Router } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '../index';
import { authenticateJWT, getJwtUser } from '../middlewares/auth';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretjwtkey';

function generateSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').slice(0, 40) + '-' + Date.now().toString(36);
}

router.post('/register', async (req, res) => {
  const { email, password, name, organizationName } = req.body;
  if (!email || !password || !organizationName) {
    return res.status(400).json({ error: 'email, password, and organizationName are required' });
  }
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    let org = await prisma.organization.findFirst({ where: { name: organizationName } });
    const isFirstUser = !org;
    if (!org) {
      const slug = generateSlug(organizationName);
      org = await prisma.organization.create({ data: { name: organizationName, slug } });
    }
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return res.status(400).json({ error: 'Email already registered' });

    const user = await prisma.user.create({
      data: { email, password: hashedPassword, name: name || email.split('@')[0], organizationId: org.id, role: isFirstUser ? 'ADMIN' : 'MEMBER' },
    });

    const token = jwt.sign(
      { id: user.id, role: user.role, organizationId: user.organizationId, email: user.email, name: user.name },
      JWT_SECRET, { expiresIn: '7d' }
    );
    res.status(201).json({ token, user: { id: user.id, email: user.email, name: user.name, role: user.role, organizationId: user.organizationId } });
  } catch (error) {
    console.error('Register error:', error);
    res.status(400).json({ error: 'Registration failed' });
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'email and password are required' });
  try {
    const user = await prisma.user.findUnique({ where: { email }, include: { organization: true } });
    if (!user || !user.password) return res.status(401).json({ error: 'Invalid credentials' });
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign(
      { id: user.id, role: user.role, organizationId: user.organizationId, email: user.email, name: user.name },
      JWT_SECRET, { expiresIn: '7d' }
    );
    res.json({ token, user: { id: user.id, email: user.email, name: user.name, role: user.role, avatarUrl: user.avatarUrl, organizationId: user.organizationId, organization: { id: user.organization.id, name: user.organization.name, slug: user.organization.slug } } });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

router.get('/me', authenticateJWT, async (req, res) => {
  const jwtUser = getJwtUser(req);
  try {
    const user = await prisma.user.findUnique({ where: { id: jwtUser.id }, include: { organization: true } });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ id: user.id, email: user.email, name: user.name, role: user.role, avatarUrl: user.avatarUrl, organizationId: user.organizationId, organization: { id: user.organization.id, name: user.organization.name, slug: user.organization.slug }, createdAt: user.createdAt });
  } catch {
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

export default router;
