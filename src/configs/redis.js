import { createClient } from "redis";

const redisClient = createClient({
  url: process.env.REDIS_URL
});

//  Event listeners for debugging
redisClient.on("error", (err) => console.error(" Redis Client Error:", err));
redisClient.on("connect", () => console.log("Redis connected ... "));

// Export a function to connect, and the client itself
export const connectRedis = async () => {
  try {
    await redisClient.connect();
  } catch (err) {
    console.error("Failed to connect to Redis", err);
  }
};

export default redisClient;