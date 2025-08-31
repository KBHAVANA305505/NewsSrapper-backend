import { Article, Category } from '../models';
import { GetArticlesQuery, GetTrendingQuery } from '../utils/validation';
import { redisClient } from '../index';
import { logger } from '../utils/logger';
import crypto from 'crypto';
import slugify from 'slugify';

export class ArticleService {
  async createArticle(data: any) {
    try {
      // Auto-generate slug if not provided
      const slug = data.slug || slugify(data.title, { lower: true, strict: true });

      // Auto-generate hash if not provided
      const hash = data.hash || crypto.createHash('md5').update(data.content).digest('hex');

      const article = new Article({
        ...data,
        slug,
        hash,
      });

      await article.save();
      return article;
    } catch (error) {
      logger.error('Create article error:', error);
      throw error;
    }
  }

  async getArticles(filter: any, query: GetArticlesQuery) {
    try {
      const { page = '1', limit = '10' } = query;

      const pageNum = parseInt(page);
      const limitNum = parseInt(limit);
      const skip = (pageNum - 1) * limitNum;

      const articles = await Article.find(filter)
        .populate('category', 'key label icon color')
        .populate('sourceId', 'name')
        .sort({ publishedAt: -1 })
        .skip(skip)
        .limit(limitNum);

      const total = await Article.countDocuments(filter);

      return {
        articles,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum),
        },
      };
    } catch (error) {
      logger.error('Get articles error:', error);
      throw error;
    }
  }

  async getArticleBySlug(slug: string) {
    try {
      const cacheKey = `article:${slug}`;
      const cachedArticle = await redisClient.get(cacheKey);
      
      if (cachedArticle) {
        return JSON.parse(cachedArticle);
      }

      const article = await Article.findOne({ slug, status: 'published' })
        .populate('category', 'key label icon color')
        .populate('sourceId', 'name');

      if (!article) {
        throw new Error('Article not found');
      }

      await Article.findByIdAndUpdate(article._id, { $inc: { viewCount: 1 } });

      await redisClient.setEx(cacheKey, 3600, JSON.stringify(article));

      return article;
    } catch (error) {
      logger.error('Get article by slug error:', error);
      throw error;
    }
  }

  async getTrending(query: GetTrendingQuery) {
    try {
      const { limit = '10' } = query;
      const limitNum = parseInt(limit);

      const cacheKey = `trending:${limit}`;
      const cachedTrending = await redisClient.get(cacheKey);
      
      if (cachedTrending) {
        return JSON.parse(cachedTrending);
      }

      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const trending = await Article.find({
        status: 'published',
        publishedAt: { $gte: sevenDaysAgo },
      })
        .populate('category', 'key label icon color')
        .populate('sourceId', 'name')
        .sort({ viewCount: -1, publishedAt: -1 })
        .limit(limitNum);

      await redisClient.setEx(cacheKey, 1800, JSON.stringify(trending));

      return trending;
    } catch (error) {
      logger.error('Get trending error:', error);
      throw error;
    }
  }

  async updateArticle(id: string, data: any) {
    try {
      const article = await Article.findByIdAndUpdate(id, data, { new: true });
      if (!article) {
        throw new Error('Article not found');
      }
      return article;
    } catch (error) {
      logger.error('Update article error:', error);
      throw error;
    }
  }

  async publishArticle(id: string) {
    try {
      const article = await Article.findByIdAndUpdate(
        id,
        { 
          status: 'published',
          publishedAt: new Date(),
        },
        { new: true }
      );
      
      if (!article) {
        throw new Error('Article not found');
      }

      await this.clearArticleCaches();

      return article;
    } catch (error) {
      logger.error('Publish article error:', error);
      throw error;
    }
  }

  async deleteArticle(id: string) {
  try {
    const article = await Article.findByIdAndDelete(id);
    if (!article) {
      throw new Error('Article not found');
    }
    return article;
  } catch (error) {
    logger.error('Delete article error:', error);
    throw error;
  }
}

  private async clearArticleCaches() {
    try {
      const keys = await redisClient.keys('trending:*');
      if (keys.length > 0) {
        await redisClient.del(keys);
      }

      const articleKeys = await redisClient.keys('article:*');
      if (articleKeys.length > 0) {
        await redisClient.del(articleKeys);
      }
    } catch (error) {
      logger.error('Clear article caches error:', error);
    }
  }
}

