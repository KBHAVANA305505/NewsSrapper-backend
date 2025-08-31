import { Router } from 'express';
import { PublicController } from '../controllers/public.controller';

const router = Router();
const publicController = new PublicController();

// Health check
router.get('/health', publicController.getHealth);

// Articles
router.get('/articles', publicController.getArticles);
router.get('/articles/:slug', publicController.getArticles);

// New: Create article
router.post('/articles', publicController.createArticle);


// Categories
router.get('/categories', publicController.getCategories);

// Trending
router.get('/trending', publicController.getTrending);

// Tickers
router.get('/ticker/active', publicController.getActiveTickers);

export default router;
