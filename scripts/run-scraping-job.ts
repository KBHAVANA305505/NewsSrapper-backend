// scripts/run-scraping-job.ts
import 'dotenv/config';
import { Queue, Worker } from 'bullmq';
import IORedis from 'ioredis';
import { JobProcessor } from '../src/jobs/job.processor';
import { logger } from '../src/utils/logger';

const connection = new IORedis(process.env.REDIS_URL!, {
  maxRetriesPerRequest: null,
});

const scrapingQueue = new Queue('scraping-queue', { connection });

async function runJob() {
  console.log('Adding a new scraping job to the queue...');
  
  // Add one job to the queue
  await scrapingQueue.add('scrape-source', {});
  console.log('Job added.');

  // Create a worker to process just this one job
  const worker = new Worker('scraping-queue', async (job) => {
    const processor = new JobProcessor();
    await processor.processScrapingJob(job);
  }, { connection });

  console.log('Worker started. Waiting for job to complete...');
  
  // Wait for the job to complete or fail
  await new Promise<void>((resolve) => {
    worker.on('completed', (job) => {
      logger.info(`Job ${job.id} has completed successfully.`);
      resolve();
    });

    worker.on('failed', (job, err) => {
      logger.error(`Job ${job?.id} has failed with error: ${err.message}`);
      resolve(); // Resolve even on failure so the cron job can exit
    });
  });

  // Clean up and close connections
  await worker.close();
  await connection.quit();
  console.log('Worker finished and connections closed.');
}

runJob().catch(err => {
  console.error('Error running scraping job:', err);
  process.exit(1);
});