import { Request, Response, NextFunction } from "express";
import { StatusCodes } from "http-status-codes";
import { DirectoryServices } from "../services/index";
import CustomSuccess from "../utils/SuccessResponse";
import { validateInputs } from "../utils/ValidateInputs";
import { nameSchema } from "../validators/commonValidation";
import { sanitizeInput } from "../utils/sanitizeInput";

export const getDir = async (req: any, res: Response, next: NextFunction): Promise<any> => {
  const { id } = req.params;
  const userId = req.user?._id;

  try {
    const directoryData = await DirectoryServices.GetDirectoryDataService(
      userId,
      id
    );

    return CustomSuccess.send(res, "", StatusCodes.OK, directoryData);
  } catch (error) {
    next(error);
  }
};

export const updateDir = async (req: any, res: Response, next: NextFunction): Promise<any> => {
  const { id } = req.params;
  const userId = req.user._id;
  const { name } = req.body;
  try {
    const sanitizedData = sanitizeInput(name);
    const parsedName = validateInputs(nameSchema, sanitizedData);
    await DirectoryServices.UpdateDirectoryDataService(userId, id, parsedName);
    return CustomSuccess.send(res, "Directory renamed", StatusCodes.OK);
  } catch (error) {
    next(error);
  }
};

export const createDir = async (req: any, res: Response, next: NextFunction): Promise<any> => {
  const user = req.user;
  const parentDirId = req.params.parentDirId || user.rootDirId;
  const { dirname } = req.headers;

  try {
    const sanitizedData = sanitizeInput(dirname as string);
    const parsedName = validateInputs(nameSchema, sanitizedData);
    const directory = await DirectoryServices.CreateDirectoryService(
      parentDirId,
      user._id,
      parsedName
    );
    return CustomSuccess.send(
      res,
      "Directory created",
      StatusCodes.OK,
      directory
    );
  } catch (error) {
    next(error);
  }
};

export const deleteDir = async (req: any, res: Response, next: NextFunction): Promise<any> => {
  const { id } = req.params;
  const userId = req.user._id;
  try {
    await DirectoryServices.DeleteDirectoryService(id, userId);
    return CustomSuccess.send(res, "Directory deleted", StatusCodes.OK);
  } catch (error) {
    next(error);
  }
};
