import { StatusCodes } from "http-status-codes";
import redisClient from "../../config/redis";
import CustomError from "../../utils/ErrorResponse";
import User from "../../models/userModel";

export const checkSessionLimit = async (userId: string): Promise<void> => {
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
