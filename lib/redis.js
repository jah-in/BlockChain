import { createClient } from "redis";

const redisUrl =
  process.env.REDIS_URL || "redis://localhost:6379";

const globalForRedis = globalThis;

if (!globalForRedis.redis) {
  globalForRedis.redis = createClient({
    url: redisUrl,
  });

  globalForRedis.redis.on("error", (error) => {
    console.error("Redis Client Error:", error);
  });

  globalForRedis.redis.on("connect", () => {
    console.log("Redis client connecting...");
  });

  globalForRedis.redis.on("ready", () => {
    console.log("Redis client ready.");
  });

  globalForRedis.redis.on("end", () => {
    console.log("Redis client disconnected.");
  });
}

export async function getRedis() {
  const redis = globalForRedis.redis;

  if (!redis.isOpen) {
    console.log("Connecting to Redis...");
    await redis.connect();
    console.log("Redis connected.");
  }

  return redis;
}