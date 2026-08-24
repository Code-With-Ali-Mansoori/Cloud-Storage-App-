import { Request, Response, NextFunction } from "express";
import { StatusCodes } from "http-status-codes";
import githubClient from "../services/auth/githubAuthService";
import { AuthServices } from "../services/index";
import { sanitizeObject } from "../utils/sanitizeInput";
import { setCookie } from "../utils/setCookie";
import CustomSuccess from "../utils/SuccessResponse";
import { validateInputs } from "../utils/ValidateInputs";
import {
  loginValidations,
  registerValidations,
} from "../validators/authSchema";

export const registerUser = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  try {
    const sanitizedData = sanitizeObject(req.body);
    const parsedData = validateInputs(registerValidations, sanitizedData);
    await AuthServices.RegisterUserService(parsedData);
    return CustomSuccess.send(res, "User registered", StatusCodes.CREATED);
  } catch (error) {
    next(error);
  }
};

export const loginUser = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  try {
    const sanitizedData = sanitizeObject(req.body);
    const parsedData = validateInputs(loginValidations, sanitizedData);
    const { sessionID, sessionExpiry } =
      await AuthServices.LoginUserService(parsedData);
    setCookie(res, sessionID, sessionExpiry);
    return CustomSuccess.send(res, "Logged in successful", StatusCodes.OK);
  } catch (error) {
    next(error);
  }
};

export const loginWithGoogle = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  const code = req.body.code;

  try {
    const { sessionExpiry, sessionID } =
      await AuthServices.LoginWithGoogleService(code);
    setCookie(res, sessionID, sessionExpiry);
    return CustomSuccess.send(res, "Logged in Successfull", StatusCodes.OK);
  } catch (error) {
    next(error);
  }
};

export const redirectToAuthURL = async (req: Request, res: Response): Promise<void> => {
  const referer = req.get("referer");
  const clientOrigin = referer ? new URL(referer).origin : null;
  const { state: githubState, url } = githubClient.getWebFlowAuthorizationUrl({
    scopes: ["read:user", "user:email"],
    redirectUrl: `https://api.storemystuff.cloud/auth/github/callback`,
  });

  const combinedState = Buffer.from(
    JSON.stringify({
      githubState,
      clientOrigin,
    })
  ).toString("base64");

  res.cookie("_github_state", githubState, {
    httpOnly: true,
    signed: true,
    maxAge: 1000 * 60 * 10,
  });

  const redirectURL = `${url}&state=${combinedState}`;
  res.redirect(redirectURL);
};

export const loginWithGithub = async (req: any, res: Response, next: NextFunction): Promise<any> => {
  const { _github_state } = req.signedCookies;
  const { code, state } = req.query;

  try {
    const { githubState, clientOrigin } = JSON.parse(
      Buffer.from(state as string, "base64").toString()
    );
    const { sessionID, sessionExpiry } =
      await AuthServices.LoginWithGitHubService(
        _github_state,
        code as string,
        githubState
      );
    setCookie(res, sessionID, sessionExpiry);

    return res.redirect(`${clientOrigin}/`);
  } catch (error: any) {
    const fallback = process.env.DEFAULT_CLIENT_URL;
    if (error?.details?.sessionLimitExceed) {
      return res.redirect(
        `${fallback}/auth/error?temp_token=${encodeURIComponent(
          error?.details?.temp_token
        )}`
      );
    }

    return res.redirect(
      `${fallback}/auth/error?message=${encodeURIComponent(error?.message || String(error))}`
    );
  }
};

export const DeleteAndCreateSession = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  const { temp_token } = req.body;
  try {
    const { sessionExpiry, sessionID } =
      await AuthServices.RefreshUserSessionService(temp_token);
    setCookie(res, sessionID, sessionExpiry);
    return CustomSuccess.send(res, "Session Created", StatusCodes.CREATED);
  } catch (error) {
    next(error);
  }
};
