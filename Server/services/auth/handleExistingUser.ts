import { checkSessionLimit } from "./checkSessionLimit";
import { createRedisSession } from "./createRedisSession";

export const handleExistingUser = async (userId: any): Promise<{ sessionID: string; sessionExpiry: number }> => {
  await checkSessionLimit(userId.toString());
  return await createRedisSession(userId.toString());
};
