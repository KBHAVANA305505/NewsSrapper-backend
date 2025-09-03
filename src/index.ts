// src/index.ts
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import { createClient } from 'redis';
import { Queue, Worker } from 'bullmq'; 
import IORedis from 'ioredis';        
import cron from 'node-cron';       
import { setupRoutes } from './routes';
import { setupMiddleware } from './middleware';
import { logger } from './utils/logger';
import { setupSwagger } from './config/swagger';
import { JobProcessor } from './jobs/job.processor'; 
const app = express();
const PORT: number = parseInt(process.env.PORT || "8080", 10);

// Setup Express Middleware
app.use(cors({ origin: 'http://localhost:3000' }));
setupMiddleware(app);
setupRoutes(app);
setupSwagger(app);

// Create a reusable Redis connection for BullMQ
const redisConnection = new IORedis(process.env.REDIS_URL!, {
  maxRetriesPerRequest: null,
});

// 1. THE SCHEDULER: Adds a job to the queue every 15 minutes
const scrapingQueue = new Queue('scraping-queue', { connection: redisConnection });

cron.schedule('*/15 * * * *', async () => {
  logger.info('Scheduler running: Adding scrape-source job to the queue.');
  await scrapingQueue.add('scrape-source', {});
});
logger.info('Cron job scheduled to run every 15 minutes.');

// 2. THE WORKER: Processes jobs from the queue
const processor = new JobProcessor();
const worker = new Worker('scraping-queue', async (job) => {
  logger.info(`Worker processing job: ${job.id} of type ${job.name}`);
  if (job.name === 'scrape-source') {
    await processor.processScrapingJob(job);
  }
}, { connection: redisConnection });

worker.on('completed', (job) => logger.info(`Job ${job.id} has completed.`));
worker.on('failed', (job, err) => logger.error(`Job ${job?.id} has failed: ${err.message}`));
logger.info('BullMQ worker is running and listening for jobs.');


// Connect to MongoDB and start the server
mongoose.connect(process.env.MONGO_URI!)
  .then(() => {
    logger.info('Connected to MongoDB');
    app.listen(PORT, '0.0.0.0', () => { // Use 0.0.0.0 for Render compatibility
      logger.info(`Server, Worker, and Scheduler running on port ${PORT}`);
    });
  })
  .catch((err) => {
    logger.error('MongoDB connection error:', err);
    process.exit(1);
  });