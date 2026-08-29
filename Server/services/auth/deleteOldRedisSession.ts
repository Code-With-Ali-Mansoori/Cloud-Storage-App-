import redisClient from "../../config/redis";
import User from "../../models/userModel";

export const deleteOldRedisSession = async (userId: string): Promise<void> => {
  const user = await User.findById(userId).select("maxDevices").lean();

  let userSessions: any = { total: 0, documents: [] };
  try {
    userSessions = (await redisClient.ft.search(
      "userIdIdx",
      `@userId:{${userId}}`,
      {
        RETURN: [],
      }
    )) as any;
  } catch (error: any) {
    const message = error?.message || String(error);
    if (!message.includes("Index not found") && !message.includes("Unknown index name")) {
      throw error;
    }
    console.warn("Redis index userIdIdx not found during session cleanup; skipping delete.");
  }

  const maxDevices = user?.maxDevices || 1;
  if (userSessions.total >= maxDevices && userSessions.documents?.[0]?.id) {
    await redisClient.del(userSessions.documents[0].id);
  }
};
