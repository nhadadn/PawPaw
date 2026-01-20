import { Router } from 'express';
import { AdminController } from '../controllers/admin.controller';
import { adminAuthMiddleware } from '../middleware/admin.middleware';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Admin
 *   description: Admin management endpoints
 */

/**
 * @swagger
 * /admin/login:
 *   post:
 *     summary: Admin login
 *     tags: [Admin]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 */
// Public routes (Auth)
router.post('/login', AdminController.login);

// Protected routes
router.use(adminAuthMiddleware);

/**
 * @swagger
 * /admin/products:
 *   get:
 *     summary: Get all products
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of products
 */
router.get('/products', AdminController.getProducts);

/**
 * @swagger
 * /admin/products/{id}:
 *   get:
 *     summary: Get product by ID
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Product details
 */
router.get('/products/:id', AdminController.getProduct);

/**
 * @swagger
 * /admin/products:
 *   post:
 *     summary: Create a product
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - priceCents
 *             properties:
 *               name:
 *                 type: string
 *               priceCents:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Product created
 */
router.post('/products', AdminController.createProduct);
router.put('/products/:id', AdminController.updateProduct);
router.delete('/products/:id', AdminController.deleteProduct);

/**
 * @swagger
 * /admin/categories:
 *   get:
 *     summary: Get all categories
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of categories
 */
router.get('/categories', AdminController.getCategories);
router.post('/categories', AdminController.createCategory);

/**
 * @swagger
 * /admin/orders:
 *   get:
 *     summary: Get all orders
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of orders
 */
router.get('/orders', AdminController.getOrders);
router.get('/orders/:id', AdminController.getOrder);
router.put('/orders/:id/status', AdminController.updateOrderStatus);

router.put('/inventory/:id', AdminController.updateInventory);

router.get('/users', AdminController.getUsers);
router.put('/users/:id/status', AdminController.updateUserStatus);

/**
 * @swagger
 * /admin/dashboard/stats:
 *   get:
 *     summary: Get dashboard stats
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard statistics
 */
router.get('/dashboard/stats', AdminController.getDashboardStats);

export const adminRoutes = router;
