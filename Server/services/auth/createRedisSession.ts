import redisClient from "../../config/redis";

export const createRedisSession = async (userId: string): Promise<{ sessionID: string; sessionExpiry: number }> => {
  const sessionID = crypto.randomUUID();
  const sessionExpiry = 7 * 24 * 60 * 60 * 1000;
  await redisClient.json.set(`session:${sessionID}`, "$", {
    userId,
  });
  await redisClient.expire(`session:${sessionID}`, sessionExpiry / 1000);

  return {
    sessionID,
    sessionExpiry,
  };
};
