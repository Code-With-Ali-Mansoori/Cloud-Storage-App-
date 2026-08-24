import { deleteOldRedisSession } from "./deleteOldRedisSession";
import { parseTempToken } from "./parseTempToken";
import { StatusCodes } from "http-status-codes";
import CustomError from "../../utils/ErrorResponse";
import githubClient from "../auth/githubAuthService";
import { verifyGoogleCode } from "../auth/googleService";
import { findAndValidateOAuthUser } from "./findAndValidateOAuthUser";
import { handleExistingUser } from "./handleExistingUser";
import { registerNewOAuthUser } from "./registerNewOAuthUser";
import { checkSessionLimit } from "./checkSessionLimit";
import { createRedisSession } from "./createRedisSession";
import { isValidCredentials } from "./isValidCredentials";
import mongoose from "mongoose";
import { createUserWithRootDir } from "./createUserWithRootDir";
import { isValidOTP } from "./isValidOTP";
import { userExists } from "./userExists";

const registerUserService = async (data: any): Promise<void> => {
  const session = await mongoose.startSession();
  let transactionStarted = false;

  try {
    const { email, name, password, otp } = data;

    await userExists(email);
    await isValidOTP(email, otp);

    session.startTransaction();
    transactionStarted = true;

    await createUserWithRootDir(name, email, true, "email", session, password);
    await session.commitTransaction();
  } catch (error) {
    if (transactionStarted) await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

const loginUserService = async (data: any): Promise<any> => {
  try {
    const { email, password, otp } = data;

    const user = await isValidCredentials(email, password);
    await isValidOTP(email, otp);

    await checkSessionLimit(user._id.toString());

    const sessionInfo = await createRedisSession(user._id.toString());

    return sessionInfo;
  } catch (error) {
    throw error;
  }
};

const loginWithGoogleService = async (code: string): Promise<any> => {
  const mongooseSession = await mongoose.startSession();
  let transactionStarted = false;
  try {
    const { email, name, picture } = await verifyGoogleCode(code);

    const existingUser = await findAndValidateOAuthUser(
      "google",
      email,
      picture
    );

    if (existingUser) {
      return await handleExistingUser(existingUser._id.toString());
    }

    mongooseSession.startTransaction();
    transactionStarted = true;

    const sessionInfo = await registerNewOAuthUser(
      "google",
      name,
      email,
      picture,
      mongooseSession
    );
    await mongooseSession.commitTransaction();

    return sessionInfo;
  } catch (error) {
    if (transactionStarted) await mongooseSession.abortTransaction();
    throw error;
  } finally {
    mongooseSession.endSession();
  }
};

const loginWithGitHubService = async (_github_state: string, code: string, state: string): Promise<any> => {
  if (!_github_state || !code || !state || _github_state !== state) {
    throw new CustomError(
      "GitHub login failed: Invalid state or missing code.",
      StatusCodes.NOT_FOUND
    );
  }

  const mongooseSession = await mongoose.startSession();
  let transactionStarted = false;

  try {
    const { email, name, picture } = await githubClient.getUserDetails(code);
    if (!email) {
      throw new CustomError(
        "Your GitHub email is not verified. Please verify and try again",
        StatusCodes.NOT_FOUND
      );
    }

    const existingUser = await findAndValidateOAuthUser(
      "github",
      email,
      picture
    );

    if (existingUser) {
      return await handleExistingUser(existingUser._id.toString());
    }

    mongooseSession.startTransaction();
    transactionStarted = true;

    const sessionInfo = await registerNewOAuthUser(
      "github",
      name,
      email,
      picture,
      mongooseSession
    );
    await mongooseSession.commitTransaction();
    return sessionInfo;
  } catch (error) {
    throw error;
  }
};

const refreshUserSessionService = async (temp_token: string): Promise<any> => {
  if (!temp_token) {
    throw new CustomError("Login token not found.", StatusCodes.BAD_REQUEST);
  }

  const userId = await parseTempToken(temp_token);

  await deleteOldRedisSession(userId);
  return await createRedisSession(userId);
};

export default {
  RegisterUserService: registerUserService,
  LoginUserService: loginUserService,
  LoginWithGoogleService: loginWithGoogleService,
  LoginWithGitHubService: loginWithGitHubService,
  RefreshUserSessionService: refreshUserSessionService,
};
