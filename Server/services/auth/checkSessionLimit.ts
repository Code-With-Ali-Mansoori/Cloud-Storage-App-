import { StatusCodes } from "http-status-codes";
import redisClient from "../../config/redis";
import CustomError from "../../utils/ErrorResponse";
import User from "../../models/userModel";

export const checkSessionLimit = async (userId: string): Promise<void> => {
  const user = await User.findById(userId).select("maxDevices").lean();

  let userSessionsTotal = 0;
  try {
    const userSessions = (await redisClient.ft.search(
      "userIdIdx",
      `@userId:{${userId}}`,
      {
        RETURN: [],
      }
    )) as any;
    userSessionsTotal = userSessions.total || 0;
  } catch (error: any) {
    const message = error?.message || String(error);
    if (!message.includes("Index not found") && !message.includes("Unknown index name")) {
      throw error;
    }
    console.warn("Redis index userIdIdx not found during session count; treating as 0 sessions.");
  }

  const maxDevices = user?.maxDevices || 1;
  if (userSessionsTotal >= maxDevices) {
    const loginToken = crypto.randomUUID();
    await redisClient.set(
      `temp_login_token:${loginToken}`,
      JSON.stringify({
        userId,
      }),
      { EX: 300 } // 5 mins
    );
    throw new CustomError("Session Limit Exceed", StatusCodes.CONFLICT, {
      details: {
        sessionLimitExceed: true,
        temp_token: loginToken,
      },
    });
  }
};
