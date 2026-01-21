import { Router } from 'express';
import { ShopController } from '../controllers/shop.controller';

const router = Router();

// Public routes
router.get('/products', ShopController.getProducts);
router.get('/products/:id', ShopController.getProduct);
router.get('/categories', ShopController.getCategories);

export default router;
