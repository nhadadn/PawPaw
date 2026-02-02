import { z } from 'zod';
import { UserRole, OrderStatus } from '@prisma/client';

export const ProductSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1).optional(), // Optional because it can be auto-generated
  description: z.string().optional(),
  imageUrl: z.string().optional(),
  videoUrl: z.string().optional(),
  categoryId: z.number().int().positive().optional(),
  priceCents: z.number().int().nonnegative(),
  currency: z.string().default('MXN'),
  isActive: z.boolean().default(true),
  isDrop: z.boolean().default(false),
  dropDate: z.string().datetime().optional().nullable(),
  maxPerCustomer: z.number().int().positive().optional().nullable(),
  initialStock: z.number().int().nonnegative().optional(), // Virtual field for creation
});

export const CategorySchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1).optional(),
  description: z.string().optional(),
  imageUrl: z.string().optional(),
});

export const UpdateOrderStatusSchema = z.object({
  status: z.nativeEnum(OrderStatus),
});

export const UpdateInventorySchema = z.object({
  reservedStock: z.number().int().nonnegative().optional(),
  initialStock: z.number().int().nonnegative().optional(),
});

export const UpdateUserStatusSchema = z.object({
  role: z.nativeEnum(UserRole),
});

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});
