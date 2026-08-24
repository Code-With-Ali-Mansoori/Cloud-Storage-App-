import { Request, Response, NextFunction } from "express";
import { Types } from "mongoose";
import CustomError from "../utils/ErrorResponse";
import { StatusCodes } from "http-status-codes";

export default function validateRequest(req: Request, res: Response, next: NextFunction, id: string): void {
  if (!Types.ObjectId.isValid(id)) {
    throw new CustomError(`Invalid ID: ${id}`, StatusCodes.CONFLICT);
  }

  next();
}
