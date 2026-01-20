import { z } from 'zod';

export const ProductSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  description: z.string().optional(),
  categoryId: z.number().int().positive().optional(),
  priceCents: z.number().int().nonnegative(),
  currency: z.string().default('MXN'),
  isActive: z.boolean().default(true),
  isDrop: z.boolean().default(false),
  dropDate: z.string().datetime().optional().nullable(),
  maxPerCustomer: z.number().int().positive().optional().nullable(),
});

export const CategorySchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
});

export const UpdateOrderStatusSchema = z.object({
  status: z.enum(['pending', 'paid', 'shipped', 'cancelled']),
});

export const UpdateInventorySchema = z.object({
  reservedStock: z.number().int().nonnegative().optional(),
  initialStock: z.number().int().nonnegative().optional(),
});

export const UpdateUserStatusSchema = z.object({
  role: z.enum(['admin', 'customer']),
});

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});
