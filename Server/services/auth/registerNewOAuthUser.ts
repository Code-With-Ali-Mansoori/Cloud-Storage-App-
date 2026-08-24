import { createRedisSession } from "./createRedisSession";
import { createUserWithRootDir } from "./createUserWithRootDir";

export const registerNewOAuthUser = async (
  provider: string,
  name: string,
  email: string,
  picture: string,
  mongooseSession: any
): Promise<{ sessionID: string; sessionExpiry: number }> => {
  const userId = await createUserWithRootDir(
    name,
    email,
    false,
    provider,
    mongooseSession,
    undefined,
    picture
  );
  return await createRedisSession(userId.toString());
};
