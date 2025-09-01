
import { createClient } from "redis";
import { logger } from "./logger";

const redisClient = createClient({
  url: process.env.REDIS_URL, // we’ll keep it in env for safety
});

redisClient.on("connect", () => {
  logger.info("Connected to Redis");
});

redisClient.on("error", (err) => {
  logger.error("Redis Client Error", err);
});

(async () => {
  try {
    await redisClient.connect();
  } catch (err) {
    logger.error("Redis connection failed:", err);
  }
})();

export { redisClient };
