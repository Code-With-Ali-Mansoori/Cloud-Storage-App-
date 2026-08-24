import { Request, Response, NextFunction } from "express";
import { StatusCodes } from "http-status-codes";
import CustomError from "../utils/ErrorResponse";

export const checkRole = (req: Request & { user?: any }, _: Response, next: NextFunction): void => {
  const { role } = req.user || {};

  if (!["Manager", "Admin", "SuperAdmin"].includes(role)) {
    throw new CustomError(
      "You're not authorized to make this action",
      StatusCodes.UNAUTHORIZED
    );
  }

  next();
};
