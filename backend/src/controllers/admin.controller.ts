import { Request, Response } from 'express';
import { AdminService } from '../services/admin.service';
import { ProductSchema, CategorySchema, UpdateOrderStatusSchema, UpdateInventorySchema, UpdateUserStatusSchema, LoginSchema } from '../schemas/admin.schemas';
import jwt from 'jsonwebtoken';

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
      console.error('GetProducts Error:', error);
      res.status(500).json({ error: 'INTERNAL_SERVER_ERROR', message: 'Failed to fetch products', details: error instanceof Error ? error.message : String(error) });
    }
  }

  static async getProduct(req: Request, res: Response) {
      try {
          const id = parseInt(req.params.id);
          const product = await service.getProduct(id);
          if (!product) return res.status(404).json({ error: 'NOT_FOUND', message: 'Product not found' });
          res.json(product);
      } catch (error) {
          res.status(500).json({ error: 'INTERNAL_SERVER_ERROR', message: 'Failed to fetch product' });
      }
  }

  static async createProduct(req: Request, res: Response) {
    try {
      const data = ProductSchema.parse(req.body);
      const product = await service.createProduct(data);
      res.status(201).json(product);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: 'VALIDATION_ERROR', details: error.errors });
      }
      res.status(500).json({ error: 'INTERNAL_SERVER_ERROR', message: 'Failed to create product' });
    }
  }
  
  static async updateProduct(req: Request, res: Response) {
      try {
          const id = parseInt(req.params.id);
          const data = ProductSchema.partial().parse(req.body); // Allow partial updates
          const product = await service.updateProduct(id, data);
          res.json(product);
      } catch (error: any) {
          if (error.name === 'ZodError') {
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
      } catch (error) {
          res.status(500).json({ error: 'INTERNAL_SERVER_ERROR', message: 'Failed to delete product' });
      }
  }

  // Categories
  static async getCategories(req: Request, res: Response) {
    try {
      const categories = await service.getCategories();
      res.json(categories);
    } catch (error) {
      res.status(500).json({ error: 'INTERNAL_SERVER_ERROR', message: 'Failed to fetch categories' });
    }
  }
  
  static async createCategory(req: Request, res: Response) {
      try {
          const data = CategorySchema.parse(req.body);
          const category = await service.createCategory(data);
          res.status(201).json(category);
      } catch (error: any) {
          if (error.name === 'ZodError') {
              return res.status(400).json({ error: 'VALIDATION_ERROR', details: error.errors });
          }
          res.status(500).json({ error: 'INTERNAL_SERVER_ERROR', message: 'Failed to create category' });
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
      } catch (error) {
          res.status(500).json({ error: 'INTERNAL_SERVER_ERROR', message: 'Failed to fetch orders' });
      }
  }
  
  static async getOrder(req: Request, res: Response) {
      try {
          const id = parseInt(req.params.id);
          const order = await service.getOrder(id);
          if (!order) return res.status(404).json({ error: 'NOT_FOUND', message: 'Order not found' });
          res.json(order);
      } catch (error) {
          res.status(500).json({ error: 'INTERNAL_SERVER_ERROR', message: 'Failed to fetch order' });
      }
  }

  static async updateOrderStatus(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const { status } = UpdateOrderStatusSchema.parse(req.body);
      const order = await service.updateOrderStatus(id, status);
      res.json(order);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: 'VALIDATION_ERROR', details: error.errors });
      }
      res.status(500).json({ error: 'INTERNAL_SERVER_ERROR', message: 'Failed to update order status' });
    }
  }

  // Inventory
  static async updateInventory(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const data = UpdateInventorySchema.parse(req.body);
      const variant = await service.updateInventory(id, data);
      res.json(variant);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: 'VALIDATION_ERROR', details: error.errors });
      }
      res.status(500).json({ error: 'INTERNAL_SERVER_ERROR', message: 'Failed to update inventory' });
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
      } catch (error) {
          res.status(500).json({ error: 'INTERNAL_SERVER_ERROR', message: 'Failed to fetch users' });
      }
  }

  static async updateUserStatus(req: Request, res: Response) {
    try {
      const id = req.params.id;
      const { role } = UpdateUserStatusSchema.parse(req.body);
      const user = await service.updateUserStatus(id, role);
      res.json(user);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: 'VALIDATION_ERROR', details: error.errors });
      }
      res.status(500).json({ error: 'INTERNAL_SERVER_ERROR', message: 'Failed to update user status' });
    }
  }

  // Dashboard
  static async getDashboardStats(req: Request, res: Response) {
    try {
      const stats = await service.getDashboardStats();
      res.json(stats);
    } catch (error) {
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
          if (email === 'admin@pawpaw.com' && password === 'admin123') {
              const token = jwt.sign(
                  { id: 'admin-id', email, role: 'admin' },
                  process.env.JWT_SECRET || 'changeme_jwt_secret',
                  { expiresIn: '1d' }
              );
              return res.json({ token });
          }
          
          res.status(401).json({ error: 'UNAUTHORIZED', message: 'Invalid credentials' });
      } catch (error: any) {
           if (error.name === 'ZodError') {
              return res.status(400).json({ error: 'VALIDATION_ERROR', details: error.errors });
          }
          res.status(500).json({ error: 'INTERNAL_SERVER_ERROR', message: 'Login failed' });
      }
  }
}
