import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';

const router = Router();

router.get('/seed-status', async (req: Request, res: Response) => {
  try {
    const stats: any[] = await prisma.$queryRaw`
      SELECT 
        (SELECT COUNT(*)::int FROM categories) as categories,
        (SELECT COUNT(*)::int FROM products) as products,
        (SELECT COUNT(*)::int FROM product_variants) as variants,
        (SELECT COUNT(*)::int FROM users) as users;
    `;
    res.json({ status: 'ok', data: stats[0] });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch seed status', details: String(error) });
  }
});

export default router;
