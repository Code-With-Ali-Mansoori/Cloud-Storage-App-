import { Types } from "mongoose";
import Directory from "../../models/dirModel";
import User from "../../models/userModel";

export const createUserWithRootDir = async (
  name: string,
  email: string,
  canLoginWithPassword: boolean,
  createdWith: string,
  session: any,
  password?: string, // optional for social logins,
  picture?: string, // optional for normal login.
): Promise<Types.ObjectId> => {
  const rootDirId = new Types.ObjectId();
  const userId = new Types.ObjectId();

  await Directory.create(
    [
      {
        _id: rootDirId,
        name: `root-${email}`,
        userId,
        parentDirId: null,
        path: [rootDirId],
      },
    ],
    { session }
  );

  const userPayload = {
    _id: userId,
    name,
    email,
    rootDirId,
    canLoginWithPassword,
    createdWith,
    ...(password && { password }),
    ...(picture && { picture }),
    
  };

  await User.create([userPayload], { session });

  return userId;
};
