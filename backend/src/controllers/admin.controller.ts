import { Request, Response } from 'express';
import { UserRole } from '@prisma/client';
import { AdminService } from '../services/admin.service';
import {
  ProductSchema,
  CategorySchema,
  UpdateOrderStatusSchema,
  UpdateInventorySchema,
  UpdateUserStatusSchema,
  LoginSchema,
} from '../schemas/admin.schemas';
import jwt from 'jsonwebtoken';
import logger from '../lib/logger';
import { ZodError } from 'zod';

const service = new AdminService();

export class AdminController {
  // Products
  static async getProducts(req: Request, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const offset = (page - 1) * limit;
      const products = await service.getProducts(limit, offset);
      res.json(products);
    } catch (error) {
      logger.error('GetProducts Error:', error);
      res.status(500).json({
        error: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch products',
        details: error instanceof Error ? error.message : String(error),
      });
    }
  }

  static async getProduct(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const product = await service.getProduct(id);
      if (!product)
        return res.status(404).json({ error: 'NOT_FOUND', message: 'Product not found' });
      res.json(product);
    } catch (error) {
      res.status(500).json({ error: 'INTERNAL_SERVER_ERROR', message: 'Failed to fetch product' });
    }
  }

  static async createProduct(req: Request, res: Response) {
    try {
      logger.info('CreateProduct Payload:', req.body); // Log incoming payload
      logger.info('CreateProduct Files:', req.files);

      const files = req.files as Express.Multer.File[];
      // Updated to point to /uploads/products/
      const imageUrls = files?.map((f) => `/uploads/products/${f.filename}`) || [];
      logger.info('CreateProduct ImageUrls:', imageUrls);

      if (imageUrls.length > 0) {
        req.body.imageUrl = imageUrls[0]; // Set main image for backward compatibility
        req.body.images = imageUrls;
      }

      // Convert FormData strings to correct types
      if (req.body.priceCents) req.body.priceCents = parseInt(req.body.priceCents);
      if (req.body.categoryId) req.body.categoryId = parseInt(req.body.categoryId);
      if (req.body.initialStock) req.body.initialStock = parseInt(req.body.initialStock);
      if (req.body.isActive) req.body.isActive = req.body.isActive === 'true';
      if (req.body.isDrop) req.body.isDrop = req.body.isDrop === 'true';

      // Auto-generate slug if not present
      if (req.body.name && !req.body.slug) {
        req.body.slug = req.body.name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)+/g, '');
      }

      const data = ProductSchema.parse(req.body);
      // Ensure slug is present (it was auto-generated on req.body if missing)
      const slug = data.slug || req.body.slug || '';

      // images is not in schema yet but we pass it
      const product = await service.createProduct({ ...data, slug, images: imageUrls });
      res.status(201).json(product);
    } catch (error: unknown) {
      logger.error('CreateProduct Error:', error); // Log error
      if (error instanceof ZodError) {
        return res.status(400).json({ error: 'VALIDATION_ERROR', details: error.errors });
      }
      res.status(500).json({ error: 'INTERNAL_SERVER_ERROR', message: 'Failed to create product' });
    }
  }

  static async updateProduct(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      logger.info('UpdateProduct ID:', id);
      // Log headers to check Content-Type
      logger.info('UpdateProduct Headers:', req.headers['content-type']);

      // Explicitly log req.files type and content
      if (Array.isArray(req.files)) {
        logger.info(`UpdateProduct Files (Array): ${req.files.length} files`);
        req.files.forEach((f, i) =>
          logger.info(`File ${i}: ${f.originalname} (${f.mimetype}) -> ${f.filename}`)
        );
      } else if (req.files) {
        logger.info('UpdateProduct Files (Object):', Object.keys(req.files));
      } else {
        logger.info('UpdateProduct Files: No files received (req.files is undefined/null)');
      }

      logger.info('UpdateProduct Body:', JSON.stringify(req.body));

      const files = req.files as Express.Multer.File[];
      // Updated to point to /uploads/products/
      const imageUrls = files?.map((f) => `/uploads/products/${f.filename}`) || [];

      if (imageUrls.length > 0) {
        req.body.imageUrl = imageUrls[0]; // Update main image if new ones provided
      }

      // Convert FormData strings to correct types
      if (req.body.priceCents) req.body.priceCents = parseInt(req.body.priceCents);
      if (req.body.categoryId) req.body.categoryId = parseInt(req.body.categoryId);
      if (req.body.initialStock) req.body.initialStock = parseInt(req.body.initialStock);
      if (req.body.isActive !== undefined) req.body.isActive = req.body.isActive === 'true';
      if (req.body.isDrop !== undefined) req.body.isDrop = req.body.isDrop === 'true';

      // Parse imageOrder if present
      let imageOrder = [];
      if (req.body.imageOrder) {
        try {
          imageOrder = JSON.parse(req.body.imageOrder);
        } catch (e) {
          console.error('Error parsing imageOrder:', e);
        }
      }

      const data = ProductSchema.partial().parse(req.body); // Allow partial updates

      // Transform for Prisma
      const updateData: Record<string, unknown> = { ...data };

      if (imageUrls.length > 0) {
        updateData.newImages = imageUrls;
      }
      if (imageOrder.length > 0) {
        updateData.imageOrder = imageOrder;
      }

      // Capture stock before deleting, if present
      const stock = req.body.initialStock;
      delete updateData.initialStock; // Product model doesn't have initialStock

      if (data.categoryId) {
        // ... category handling
      }

      // Pass stock to service
      const product = await service.updateProduct(id, updateData, stock);
      res.json(product);
    } catch (error: unknown) {
      console.error('UpdateProduct Error:', error);
      if (error instanceof ZodError) {
        return res.status(400).json({ error: 'VALIDATION_ERROR', details: error.errors });
      }
      res.status(500).json({ error: 'INTERNAL_SERVER_ERROR', message: 'Failed to update product' });
    }
  }

  static async deleteProduct(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      await service.deleteProduct(id);
      res.status(204).send();
    } catch (error: unknown) {
      res.status(500).json({ error: 'INTERNAL_SERVER_ERROR', message: 'Failed to delete product' });
    }
  }

  // Categories
  static async getCategories(req: Request, res: Response) {
    try {
      const categories = await service.getCategories();
      res.json(categories);
    } catch (error: unknown) {
      res
        .status(500)
        .json({ error: 'INTERNAL_SERVER_ERROR', message: 'Failed to fetch categories' });
    }
  }

  static async createCategory(req: Request, res: Response) {
    try {
      if (req.file) {
        req.body.imageUrl = `/uploads/${req.file.filename}`;
      }

      if (!req.body.slug && req.body.name) {
        req.body.slug = req.body.name
          .toLowerCase()
          .replace(/ /g, '-')
          .replace(/[^\w-]+/g, '');
      }

      const data = CategorySchema.parse(req.body);
      // Ensure slug is present
      const slug = data.slug || req.body.slug || '';

      const category = await service.createCategory({ ...data, slug });
      res.status(201).json(category);
    } catch (error: unknown) {
      console.error('CreateCategory Error:', error);
      if (error instanceof ZodError) {
        return res.status(400).json({ error: 'VALIDATION_ERROR', details: error.errors });
      }
      // Check for Prisma unique constraint violation (P2002)
      // Since error is unknown, we need to cast it or check properties safely
      if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        (error as { code: string }).code === 'P2002'
      ) {
        return res
          .status(409)
          .json({ error: 'CONFLICT', message: 'Category name or slug already exists' });
      }
      res
        .status(500)
        .json({ error: 'INTERNAL_SERVER_ERROR', message: 'Failed to create category' });
    }
  }

  static async updateCategory(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);

      if (req.file) {
        req.body.imageUrl = `/uploads/${req.file.filename}`;
      }

      // If name is updated but slug is not provided, update slug too?
      // Usually we don't want to change slug on update unless explicitly requested,
      // but for now let's leave slug as is if not provided, or update it if name changes?
      // Let's keep it simple: if slug is provided, use it. If not, keep existing.
      // But if name changes, user might expect slug to change.
      // Let's NOT auto-update slug on update to preserve SEO URLs unless explicitly asked.

      const data = CategorySchema.partial().parse(req.body);
      const category = await service.updateCategory(id, data);
      res.json(category);
    } catch (error: unknown) {
      console.error('UpdateCategory Error:', error);
      if (error instanceof ZodError) {
        return res.status(400).json({ error: 'VALIDATION_ERROR', details: error.errors });
      }
      if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        (error as { code: string }).code === 'P2002'
      ) {
        return res
          .status(409)
          .json({ error: 'CONFLICT', message: 'Category name or slug already exists' });
      }
      res
        .status(500)
        .json({ error: 'INTERNAL_SERVER_ERROR', message: 'Failed to update category' });
    }
  }

  static async deleteCategory(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      await service.deleteCategory(id);
      res.status(204).send();
    } catch (error: unknown) {
      console.error('DeleteCategory Error:', error);
      res
        .status(500)
        .json({ error: 'INTERNAL_SERVER_ERROR', message: 'Failed to delete category' });
    }
  }

  // Orders
  static async getOrders(req: Request, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const offset = (page - 1) * limit;
      const orders = await service.getOrders(limit, offset);
      res.json(orders);
    } catch (error: unknown) {
      res.status(500).json({ error: 'INTERNAL_SERVER_ERROR', message: 'Failed to fetch orders' });
    }
  }

  static async getOrder(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const order = await service.getOrder(id);
      if (!order) return res.status(404).json({ error: 'NOT_FOUND', message: 'Order not found' });
      res.json(order);
    } catch (error: unknown) {
      res.status(500).json({ error: 'INTERNAL_SERVER_ERROR', message: 'Failed to fetch order' });
    }
  }

  static async updateOrderStatus(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const { status } = UpdateOrderStatusSchema.parse(req.body);
      const order = await service.updateOrderStatus(id, status);
      res.json(order);
    } catch (error: unknown) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: 'VALIDATION_ERROR', details: error.errors });
      }
      res
        .status(500)
        .json({ error: 'INTERNAL_SERVER_ERROR', message: 'Failed to update order status' });
    }
  }

  // Inventory
  static async updateInventory(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const data = UpdateInventorySchema.parse(req.body);
      const variant = await service.updateInventory(id, data);
      res.json(variant);
    } catch (error: unknown) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: 'VALIDATION_ERROR', details: error.errors });
      }
      res
        .status(500)
        .json({ error: 'INTERNAL_SERVER_ERROR', message: 'Failed to update inventory' });
    }
  }

  // Users
  static async getUsers(req: Request, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const offset = (page - 1) * limit;
      const users = await service.getUsers(limit, offset);
      res.json(users);
    } catch (error: unknown) {
      res.status(500).json({ error: 'INTERNAL_SERVER_ERROR', message: 'Failed to fetch users' });
    }
  }

  static async updateUserStatus(req: Request, res: Response) {
    try {
      const id = req.params.id;
      const { role } = UpdateUserStatusSchema.parse(req.body);
      const user = await service.updateUserStatus(id, role);
      res.json(user);
    } catch (error: unknown) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: 'VALIDATION_ERROR', details: error.errors });
      }
      res
        .status(500)
        .json({ error: 'INTERNAL_SERVER_ERROR', message: 'Failed to update user status' });
    }
  }

  // Dashboard
  static async getDashboardStats(req: Request, res: Response) {
    try {
      const stats = await service.getDashboardStats();
      res.json(stats);
    } catch (error: unknown) {
      res.status(500).json({ error: 'INTERNAL_SERVER_ERROR', message: 'Failed to fetch stats' });
    }
  }

  // Auth
  static async login(req: Request, res: Response) {
    // Logic for admin login would typically verify credentials against DB.
    // For now, let's assume we use the same auth system but check for admin role after verification.
    // However, usually login just issues a token. The middleware checks the role.
    // If we need a specific admin login that ONLY allows admins, we would verify user and check role before issuing token.

    try {
      const { email, password } = LoginSchema.parse(req.body);

      // MOCK IMPLEMENTATION: In a real app, verify against DB (User table)
      // Here we just simulate a success if it's the 'admin' email (mock)
      // Since we don't have a full User service for auth yet in this context, we will mock it.
      // BUT, to be consistent with existing auth, we should probably check DB.
      // Let's assume for now we just return a token with 'admin' role for testing purposes if credentials match a hardcoded admin or looked up user.

      // NOTE: This is a placeholder. Real implementation should check password hash.
      if (
        (email === 'admin@pawpaw.com' && password === 'admin123') ||
        (email === 'admin@pawpawurban.com' && password === 'admin123456')
      ) {
        const token = jwt.sign(
          { id: 'admin-id', email, role: UserRole.ADMIN },
          process.env.JWT_SECRET || 'changeme_jwt_secret',
          { expiresIn: '1d' }
        );
        return res.json({ token });
      }

      res.status(401).json({ error: 'UNAUTHORIZED', message: 'Invalid credentials' });
    } catch (error: unknown) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: 'VALIDATION_ERROR', details: error.errors });
      }
      res.status(500).json({ error: 'INTERNAL_SERVER_ERROR', message: 'Login failed' });
    }
  }
}
