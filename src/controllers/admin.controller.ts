import { Request, Response } from 'express';
import { ArticleService } from '../services/article.service';
import { SourceService } from '../services/source.service';
import { CategoryService } from '../services/category.service';
import { ScrapingService } from '../services/scraping.service';
import {
  createArticleSchema,
  updateArticleSchema,
  createSourceSchema,
  updateSourceSchema,
  createCategorySchema,
  updateCategorySchema,
} from '../utils/validation';
import { logger } from '../utils/logger';

export class AdminController {
  private articleService: ArticleService;
  private sourceService: SourceService;
  private categoryService: CategoryService;
  private scrapingService: ScrapingService;

  constructor() {
    this.articleService = new ArticleService();
    this.sourceService = new SourceService();
    this.categoryService = new CategoryService();
    this.scrapingService = new ScrapingService();
  }

  // Article management
  createArticle = async (req: Request, res: Response) => {
    try {
      const validatedData = createArticleSchema.parse(req.body);
      const article = await this.articleService.createArticle(validatedData);
      res.status(201).json({
        success: true,
        message: 'Article created successfully',
        data: article,
      });
    } catch (error) {
      logger.error('Create article controller error:', error);
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
        message: 'Failed to create article',
      });
    }
  };

  updateArticle = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const validatedData = updateArticleSchema.parse(req.body);
      const article = await this.articleService.updateArticle(id, validatedData);
      res.json({
        success: true,
        message: 'Article updated successfully',
        data: article,
      });
    } catch (error) {
      logger.error('Update article controller error:', error);
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
        message: 'Failed to update article',
      });
    }
  };

  publishArticle = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const article = await this.articleService.publishArticle(id);
      res.json({
        success: true,
        message: 'Article published successfully',
        data: article,
      });
    } catch (error) {
      logger.error('Publish article controller error:', error);
      if (error instanceof Error) {
        if (error.message === 'Article not found') {
          return res.status(404).json({
            success: false,
            error: 'Not Found',
            message: error.message,
          });
        }
      }
      res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to publish article',
      });
    }
  };

  deleteArticle = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const result = await this.articleService.deleteArticle(id);
      res.json({
        success: true,
        message: 'Article deleted successfully',
        data: result,
      });
    } catch (error) {
      logger.error('Delete article controller error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to delete article',
      });
    }
  };

  // Source management
  createSource = async (req: Request, res: Response) => {
    try {
      const validatedData = createSourceSchema.parse(req.body);
      const source = await this.sourceService.createSource(validatedData);
      res.status(201).json({
        success: true,
        message: 'Source created successfully',
        data: source,
      });
    } catch (error) {
      logger.error('Create source controller error:', error);
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
        message: 'Failed to create source',
      });
    }
  };

  updateSource = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const validatedData = updateSourceSchema.parse(req.body);
      const source = await this.sourceService.updateSource(id, validatedData);
      res.json({
        success: true,
        message: 'Source updated successfully',
        data: source,
      });
    } catch (error) {
      logger.error('Update source controller error:', error);
      if (error instanceof Error) {
        if (error.message === 'Source not found') {
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
        message: 'Failed to update source',
      });
    }
  };

  getSources = async (req: Request, res: Response) => {
    try {
      const filters: any = {};
      if (req.query.active !== undefined) {
        filters.active = req.query.active === 'true';
      }
      const sources = await this.sourceService.getSources(filters);
      res.json({
        success: true,
        data: sources,
      });
    } catch (error) {
      logger.error('Get sources controller error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to get sources',
      });
    }
  };

  // Category management
  createCategory = async (req: Request, res: Response) => {
    try {
      const validatedData = createCategorySchema.parse(req.body);
      const category = await this.categoryService.createCategory(validatedData);
      res.status(201).json({
        success: true,
        message: 'Category created successfully',
        data: category,
      });
    } catch (error) {
      logger.error('Create category controller error:', error);
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
        message: 'Failed to create category',
      });
    }
  };

  updateCategory = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const validatedData = updateCategorySchema.parse(req.body);
      const category = await this.categoryService.updateCategory(id, validatedData);
      res.json({
        success: true,
        message: 'Category updated successfully',
        data: category,
      });
    } catch (error) {
      logger.error('Update category controller error:', error);
      if (error instanceof Error) {
        if (error.message === 'Category not found') {
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
        message: 'Failed to update category',
      });
    }
  };

  // Ingest management
  triggerIngest = async (req: Request, res: Response) => {
    try {
      
      res.json({
        success: true,
        message: 'Scraping job triggered successfully',
      });
    } catch (error) {
      logger.error('Trigger ingest controller error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to trigger scraping',
      });
    }
  };
}