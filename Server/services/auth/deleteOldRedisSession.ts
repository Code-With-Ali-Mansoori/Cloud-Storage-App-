import redisClient from "../../config/redis";
import User from "../../models/userModel";

export const deleteOldRedisSession = async (userId: string): Promise<void> => {
  const user = await User.findById(userId).select("maxDevices").lean();
  const userSessions = (await redisClient.ft.search(
    "userIdIdx",
    `@userId:{${userId}}`,
    {
      RETURN: [],
    }
  )) as any;

  const maxDevices = user?.maxDevices || 1;
  if (userSessions.total >= maxDevices) {
    await redisClient.del(userSessions.documents[0].id);
  }
};
