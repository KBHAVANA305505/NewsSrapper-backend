import { Source } from '../models';
import { logger } from '../utils/logger';

export class SourceService {
  async getSources(filters: any = {}) {
    try {
      const sources = await Source.find(filters)
        .populate('categories', 'key label icon color')
        .sort({ name: 1 });
      
      return sources;
    } catch (error) {
      logger.error('Get sources error:', error);
      throw error;
    }
  }

  async getSourceById(id: string) {
    try {
      const source = await Source.findById(id).populate('categories', 'key label icon color');
      if (!source) {
        throw new Error('Source not found');
      }
      return source;
    } catch (error) {
      logger.error('Get source by ID error:', error);
      throw error;
    }
  }

  async createSource(data: any) {
    try {
      const source = new Source(data);
      await source.save();
      return source;
    } catch (error) {
      logger.error('Create source error:', error);
      throw error;
    }
  }

  async updateSource(id: string, data: any) {
    try {
      const source = await Source.findByIdAndUpdate(id, data, { new: true });
      if (!source) {
        throw new Error('Source not found');
      }
      return source;
    } catch (error) {
      logger.error('Update source error:', error);
      throw error;
    }
  }

  async deleteSource(id: string) {
    try {
      const source = await Source.findByIdAndDelete(id);
      if (!source) {
        throw new Error('Source not found');
      }
      return source;
    } catch (error) {
      logger.error('Delete source error:', error);
      throw error;
    }
  }

  async getActiveSources() {
    try {
      const sources = await Source.find({ active: true })
        .populate('categories', 'key label icon color')
        .sort({ name: 1 });
      
      return sources;
    } catch (error) {
      logger.error('Get active sources error:', error);
      throw error;
    }
  }

  async updateLastScraped(id: string) {
    try {
      const source = await Source.findByIdAndUpdate(
        id,
        { lastScraped: new Date() },
        { new: true }
      );
      
      if (!source) {
        throw new Error('Source not found');
      }
      
      return source;
    } catch (error) {
      logger.error('Update last scraped error:', error);
      throw error;
    }
  }
}