import { Request, Response, NextFunction } from "express";
import { StatusCodes } from "http-status-codes";
import redisClient from "../config/redis";
import User from "../models/userModel";
import CustomError from "../utils/ErrorResponse";

export default async function checkAuth(req: Request & { user?: any }, res: Response, next: NextFunction): Promise<void> {
  const { token } = req.signedCookies;

  if (!token)
    throw new CustomError("No active session found", StatusCodes.UNAUTHORIZED);

  const session = (await redisClient.json.get(`session:${token}`)) as any;
  if (!session) {
    res.clearCookie("token", {
      httpOnly: true,
      signed: true,
      sameSite: "lax",
    });

    throw new CustomError(
      "No active session found",
      StatusCodes.UNAUTHORIZED
    );
  }

  const user = await User.findById(session.userId).select("-password").lean();
  if (!user) {
    res.clearCookie("token", {
      httpOnly: true,
      signed: true,
      sameSite: "lax",
    });

    throw new CustomError(
      "No active session found",
      StatusCodes.UNAUTHORIZED
    );
  }

  if (user.isDeleted)
    throw new CustomError(
      "User is deactivated or deleted.",
      StatusCodes.FORBIDDEN
    );

  req.user = user;
  next();
}
