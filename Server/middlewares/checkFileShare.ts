import { Request, Response, NextFunction } from "express";
import { StatusCodes } from "http-status-codes";
import CustomError from "../utils/ErrorResponse";
import File from "../models/fileModel";

export const checkFileSharedViaEmail = async (req: Request & { user?: any; file?: any }, res: Response, next: NextFunction): Promise<void> => {
  const { fileId } = req.params;
  try {
    const file = await File.findById(fileId).populate("sharedWith.userId");
    if (!file) {
      throw new CustomError("File not found", StatusCodes.NOT_FOUND);
    }

    const hasAccess = file.sharedWith.find((u: any) =>
      u.userId._id.equals(req.user._id)
    );

    // Don't have permission or the User is not the editor.
    if (!hasAccess || hasAccess.permission !== "editor") {
      throw new CustomError(
        "You don't have access to this file.",
        StatusCodes.UNAUTHORIZED
      );
    }

    req.file = file as any;
    next();
  } catch (error) {
    next(error);
  }
};

export const checkFileSharedViaLink = async (req: Request & { file?: any }, _: Response, next: NextFunction): Promise<void> => {
  const fileId = req.params.fileId;

  try {
    const file = await File.findById(fileId);

    if (!file?.sharedViaLink?.enabled) {
      throw new CustomError(
        "File is not accessible, contact the owner of file.",
        StatusCodes.NOT_ACCEPTABLE
      );
    }

    if (file?.sharedViaLink?.permission !== "editor") {
      throw new CustomError(
        "File cannot be edited, contact the owner of this file",
        StatusCodes.NOT_ACCEPTABLE
      );
    }

    req.file = file as any;

    next();
  } catch (error) {
    next(error);
  }
};
