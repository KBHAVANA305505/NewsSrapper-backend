import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import { createClient } from 'redis';
import { setupRoutes } from './routes';
import { setupMiddleware } from './middleware';
import { logger } from './utils/logger';
import { setupSwagger } from './config/swagger';

const app = express();
const PORT: number = parseInt(process.env.PORT || "3001", 10);

app.use(cors({
  origin: 'http://localhost:3000'
}));

// Initialize Redis client
export const redisClient = createClient({
  url: process.env.REDIS_URL,
});

redisClient.on('error', (err) => {
  logger.error('Redis Client Error:', err);
});

redisClient.on('connect', () => {
  logger.info('Connected to Redis');
});

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI || '')
  .then(() => {
    logger.info('Connected to MongoDB');
  })
  .catch((err) => logger.error('MongoDB connection error:', err));

// Add a check to ensure Redis is connected
async function startServer() {
  try {
    await redisClient.connect();
    logger.info('Redis client connected successfully.');
  } catch (err) {
    logger.error('Redis connection failed:', err);
    process.exit(1);
  }

  // Setup middleware
  setupMiddleware(app);

  // Setup routes
  setupRoutes(app);

  // Setup Swagger
  setupSwagger(app);

  // Health check endpoint
  app.get('/health', (req, res) => {
    res.json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV,
    });
  });

  // Error handling middleware
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    logger.error('Error:', err);
    res.status(500).json({
      error: 'Internal Server Error',
      message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong',
    });
  });

  // 404 handler
  app.use('*', (req, res) => {
    res.status(404).json({ error: 'Route not found' });
  });

  // Start server
  app.listen(PORT, 'localhost', () => {
    logger.info(`Server running on port ${PORT}`);
    logger.info(`Swagger docs available at http://localhost:${PORT}/api-docs`);
  });
}

startServer();

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  await mongoose.connection.close();
  await redisClient.quit();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully');
  await mongoose.connection.close();
  await redisClient.quit();
  process.exit(0);
});