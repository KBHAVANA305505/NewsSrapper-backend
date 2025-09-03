import { createClient } from 'redis';
import { Category } from '../models';
import { logger } from '../utils/logger';

// Create a dedicated Redis client for this service
const redisClient = createClient({ url: process.env.REDIS_URL });
redisClient.on('error', (err) => logger.error('CategoryService Redis Error:', err));
if (!redisClient.isOpen) {
  redisClient.connect();
}
export class CategoryService {
  async getCategories() {
    try {
      const cacheKey = 'categories:all';
      const cachedCategories = await redisClient.get(cacheKey);
      if (cachedCategories) {
        return JSON.parse(cachedCategories);
      }
      const categories = await Category.find()
        .sort({ order: 1, label: 1 })
        .populate('parent', 'key label');

      // FIX: Use the correct syntax for the redis v4 library
      await redisClient.set(cacheKey, JSON.stringify(categories), { EX: 3600 });

      return categories;
    } catch (error) {
      logger.error('Get categories error:', error);
      throw error;
    }
  }

  async getCategoryByKey(key: string) {
    try {
      const category = await Category.findOne({ key }).populate('parent', 'key label');
      if (!category) {
        throw new Error('Category not found');
      }
      return category;
    } catch (error) {
      logger.error('Get category by key error:', error);
      throw error;
    }
  }

  async createCategory(data: any) {
    try {
      const category = new Category(data);
      await category.save();
      await this.clearCategoriesCache();
      return category;
    } catch (error) {
      logger.error('Create category error:', error);
      throw error;
    }
  }

  async updateCategory(id: string, data: any) {
    try {
      const category = await Category.findByIdAndUpdate(id, data, { new: true });
      if (!category) {
        throw new Error('Category not found');
      }
      await this.clearCategoriesCache();
      return category;
    } catch (error) {
      logger.error('Update category error:', error);
      throw error;
    }
  }

  async deleteCategory(id: string) {
    try {
      const category = await Category.findByIdAndDelete(id);
      if (!category) {
        throw new Error('Category not found');
      }
      await this.clearCategoriesCache();
      return category;
    } catch (error) {
      logger.error('Delete category error:', error);
      throw error;
    }
  }

  private async clearCategoriesCache() {
    try {
      await redisClient.del('categories:all');
    } catch (error) {
      logger.error('Clear categories cache error:', error);
    }
  }
}