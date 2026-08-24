import redisClient from "../../config/redis";
import CustomError from "../../utils/ErrorResponse";

export const parseTempToken = async (token: string): Promise<string> => {
  const isTokenStored = await redisClient.get(`temp_login_token:${token}`);

  if (!isTokenStored) {
    throw new CustomError("Token is Invalid or Expired");
  }

  const { userId } = JSON.parse(typeof isTokenStored === "string" ? isTokenStored : isTokenStored.toString());
  await redisClient.del(`temp_login_token:${token}`);

  return userId;
};
