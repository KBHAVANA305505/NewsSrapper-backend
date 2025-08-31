import { Router } from 'express';
import { AdminController } from '../controllers/admin.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();
const adminController = new AdminController();

// All admin routes require authentication and admin/editor role
router.use(authenticate);
router.use(authorize(['admin', 'editor']));

// Article management
router.post('/articles', adminController.createArticle);
router.patch('/articles/:id', adminController.updateArticle);
router.delete('/articles/:id', adminController.deleteArticle);
router.post('/articles/:id/publish', adminController.publishArticle);

// Source management
router.post('/sources', adminController.createSource);
router.patch('/sources/:id', adminController.updateSource);
router.get('/sources', adminController.getSources);

// Category management
router.post('/categories', adminController.createCategory);
router.patch('/categories/:id', adminController.updateCategory);

// Ingest management
router.post('/ingest/run', adminController.triggerIngest);

export default router;