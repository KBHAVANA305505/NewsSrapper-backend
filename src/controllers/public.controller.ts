import { Request, Response } from 'express';
import { ArticleService } from '../services/article.service';
import { CategoryService } from '../services/category.service';
import { TickerService } from '../services/ticker.service';
import { getArticlesSchema, getTrendingSchema } from '../utils/validation';
import { logger } from '../utils/logger';

export class AdminController {
  private articleService: ArticleService;

  constructor() {
    this.articleService = new ArticleService();
  }

  // NEW: Publish article
  publishArticle = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const article = await this.articleService.publishArticle(id);

      if (!article) {
        return res.status(404).json({
          success: false,
          error: 'Not Found',
          message: 'Article not found',
        });
      }

      res.json({
        success: true,
        message: 'Article published successfully',
        data: article,
      });
    } catch (error) {
      logger.error('Publish article controller error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to publish article',
      });
    }
  };
}

export class PublicController {
  private articleService: ArticleService;
  private categoryService: CategoryService;
  private tickerService: TickerService;

  constructor() {
    this.articleService = new ArticleService();
    this.categoryService = new CategoryService();
    this.tickerService = new TickerService();
  }

  getHealth = async (req: Request, res: Response) => {
    try {
      res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV,
      });
    } catch (error) {
      logger.error('Health check error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Health check failed',
      });
    }
  };

  getArticles = async (req: Request, res: Response) => {
    try {
      const { slug } = req.params;

      if (slug) {
        const article = await this.articleService.getArticleBySlug(slug);
        res.json({
          success: true,
          data: article,
        });
      } else {
        const validatedQuery = getArticlesSchema.parse(req.query);
        const filter: any = {};
        if (validatedQuery.category) {
          filter.category = validatedQuery.category;
        }
        if (validatedQuery.lang) {
          filter.lang = validatedQuery.lang;
        }
        if (validatedQuery.search) {
          filter.$text = { $search: validatedQuery.search };
        }
        filter.status = validatedQuery.status;
        const result = await this.articleService.getArticles(filter, validatedQuery);
        return res.json({
          success: true,
          data: result.articles,
        });
      }
    } catch (error) {
      logger.error('Get articles controller error:', error);
      if (error instanceof Error) {
        if (error.message === 'Article not found') {
          return res.status(404).json({
            success: false,
            error: 'Not Found',
            message: error.message,
          });
        }
        return res.status(400).json({
          success: false,
          error: 'Bad Request',
          message: error.message,
        });
      }
      res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to get articles',
      });
    }
  };

  // NEW: create article
  createArticle = async (req: Request, res: Response) => {
    try {
      const article = await this.articleService.createArticle(req.body);
      res.status(201).json({
        success: true,
        data: article,
      });
    } catch (error) {
      logger.error('Create article controller error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to create article',
      });
    }
  };

  getCategories = async (req: Request, res: Response) => {
    try {
      const categories = await this.categoryService.getCategories();

      res.json({
        success: true,
        data: categories,
      });
    } catch (error) {
      logger.error('Get categories controller error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to get categories',
      });
    }
  };

  getTrending = async (req: Request, res: Response) => {
    try {
      // Validate query parameters
      const validatedQuery = getTrendingSchema.parse(req.query);

      const trending = await this.articleService.getTrending(validatedQuery);

      res.json({
        success: true,
        data: trending,
      });
    } catch (error) {
      logger.error('Get trending controller error:', error);
      if (error instanceof Error) {
        return res.status(400).json({
          success: false,
          error: 'Bad Request',
          message: error.message,
        });
      }
      res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to get trending articles',
      });
    }
  };

  getActiveTickers = async (req: Request, res: Response) => {
    try {
      const tickers = await this.tickerService.getActiveTickers();

      res.json({
        success: true,
        data: tickers,
      });
    } catch (error) {
      logger.error('Get active tickers controller error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to get active tickers',
      });
    }
  };
}
