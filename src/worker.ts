
import 'dotenv/config';
import { Worker } from 'bullmq';
import IORedis from 'ioredis'; //  1. Import IORedis
import { JobProcessor } from './jobs/job.processor';
import { logger } from './utils/logger';

const processor = new JobProcessor();

//  2. Create a new connection instance using IORedis
const connection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null // Important for BullMQ
});

// Create a new worker that will process jobs from the 'scraping-queue'
const worker = new Worker('scraping-queue', async (job) => {
  logger.info(`Worker processing job: ${job.id} of type ${job.name}`);
  
  try {
    switch (job.name) {
      case 'scrape-source':
        await processor.processScrapingJob(job);
        break;
      // Add more cases here for other job types in the future
      default:
        throw new Error(`Unknown job name: ${job.name}`);
    }
  } catch (error) {
    logger.error(`Job ${job.id} failed:`, error);
    throw error; // Re-throw to let BullMQ know the job failed
  }
}, { connection }); //  3. Use the new IORedis connection

worker.on('completed', (job) => {
  logger.info(`Job ${job.id} has completed successfully.`);
});

worker.on('failed', (job, err) => {
  logger.error(`Job ${job?.id} has failed with error: ${err.message}`);
});

logger.info('Worker is running and waiting for jobs...');