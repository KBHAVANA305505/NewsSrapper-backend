import { createClient } from 'redis';
import { Ticker } from '../models';
import { logger } from '../utils/logger';

// Create a dedicated Redis client for this service
const redisClient = createClient({ url: process.env.REDIS_URL });
redisClient.on('error', (err) => logger.error('TickerService Redis Error:', err));
if (!redisClient.isOpen) {
  redisClient.connect();
}

export class TickerService {
  async getActiveTickers() {
    try {
      const cacheKey = 'tickers:active';
      const cachedTickers = await redisClient.get(cacheKey);
      
      if (cachedTickers) {
        return JSON.parse(cachedTickers);
      }

      const now = new Date();
      const tickers = await Ticker.find({
        expiry: { $gt: now },
      })
        .sort({ priority: -1, createdAt: -1 });

      //  FIX: Use the correct syntax for the redis v4 library
      await redisClient.set(cacheKey, JSON.stringify(tickers), { EX: 300 });

      return tickers;
    } catch (error) {
      logger.error('Get active tickers error:', error);
      throw error;
    }
  }

  async createTicker(data: any) {
    try {
      const ticker = new Ticker(data);
      await ticker.save();
      await this.clearTickersCache();
      return ticker;
    } catch (error) {
      logger.error('Create ticker error:', error);
      throw error;
    }
  }

  async updateTicker(id: string, data: any) {
    try {
      const ticker = await Ticker.findByIdAndUpdate(id, data, { new: true });
      if (!ticker) {
        throw new Error('Ticker not found');
      }
      await this.clearTickersCache();
      return ticker;
    } catch (error) {
      logger.error('Update ticker error:', error);
      throw error;
    }
  }

  async deleteTicker(id: string) {
    try {
      const ticker = await Ticker.findByIdAndDelete(id);
      if (!ticker) {
        throw new Error('Ticker not found');
      }
      await this.clearTickersCache();
      return ticker;
    } catch (error) {
      logger.error('Delete ticker error:', error);
      throw error;
    }
  }

  async cleanupExpiredTickers() {
    try {
      const now = new Date();
      const result = await Ticker.deleteMany({
        expiry: { $lte: now },
      });

      if (result.deletedCount > 0) {
        logger.info(`Cleaned up ${result.deletedCount} expired tickers`);
        await this.clearTickersCache();
      }

      return result.deletedCount;
    } catch (error) {
      logger.error('Cleanup expired tickers error:', error);
      throw error;
    }
  }

  private async clearTickersCache() {
    try {
      await redisClient.del('tickers:active');
    } catch (error) {
      logger.error('Clear tickers cache error:', error);
    }
  }
}