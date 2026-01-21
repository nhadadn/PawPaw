import { Request, Response } from 'express';
import { ShopService } from '../services/shop.service';

const service = new ShopService();

export class ShopController {
  static async getProducts(req: Request, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const category = req.query.category as string;
      const offset = (page - 1) * limit;

      const products = await service.getProducts(limit, offset, category);
      res.json(products);
    } catch (error) {
      console.error('GetProducts Error:', error);
      res.status(500).json({ error: 'INTERNAL_SERVER_ERROR', message: 'Failed to fetch products' });
    }
  }

  static async getProduct(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const product = await service.getProduct(id);
      
      if (!product) {
        return res.status(404).json({ error: 'NOT_FOUND', message: 'Product not found' });
      }
      
      res.json(product);
    } catch (error) {
      console.error('GetProduct Error:', error);
      res.status(500).json({ error: 'INTERNAL_SERVER_ERROR', message: 'Failed to fetch product' });
    }
  }

  static async getCategories(req: Request, res: Response) {
    try {
      const categories = await service.getCategories();
      res.json(categories);
    } catch (error) {
      console.error('GetCategories Error:', error);
      res.status(500).json({ error: 'INTERNAL_SERVER_ERROR', message: 'Failed to fetch categories' });
    }
  }
}
