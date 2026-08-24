import { Request, Response, NextFunction } from "express";
import { StatusCodes } from "http-status-codes";
import { UserServices } from "../services/index";
import CustomSuccess from "../utils/SuccessResponse";
import { validateInputs } from "../utils/ValidateInputs";
import { passwordSchema, roleSchema } from "../validators/commonValidation";
import { sanitizeInput } from "../utils/sanitizeInput";
import Directory from "../models/dirModel";

export const getUserInfo = async (req: any, res: Response): Promise<any> => {
  const rootDir = await Directory.findById(req.user?.rootDirId)
    .select("size")
    .lean();
  const usedStorage = rootDir?.size || 0;
  return CustomSuccess.send(res, "", StatusCodes.OK, {
    _id: req.user?._id,
    email: req.user?.email,
    name: req.user?.name,
    picture: req.user?.picture,
    role: req.user?.role,
    maxStorageLimit: req.user?.maxStorageLimit,
    usedStorageLimit: usedStorage,
    availableStorageLimit: (req.user?.maxStorageLimit || 0) - usedStorage,
    maxFileSize: req.user?.maxFileSize,
    razorpayMode: process.env.PAYMENT_ENV,
  });
};

export const logoutUser = async (req: any, res: Response, next: NextFunction): Promise<any> => {
  try {
    const { token } = req.signedCookies;
    await UserServices.LogoutUserService(token);
    res.clearCookie("token");
    return CustomSuccess.send(res, "", StatusCodes.NO_CONTENT);
  } catch (error) {
    next(error);
  }
};

export const logoutAll = async (req: any, res: Response, next: NextFunction): Promise<any> => {
  try {
    await UserServices.LogoutAllUserService(req.user._id);
    return CustomSuccess.send(res, "", StatusCodes.NO_CONTENT);
  } catch (error) {
    next(error);
  }
};

export const getAllUsers = async (req: any, res: Response, next: NextFunction): Promise<any> => {
  const currentUser = req.user;
  try {
    const Users = await UserServices.GetAllUserService(currentUser);
    CustomSuccess.send(res, "", StatusCodes.OK, {
      Users,
      currentUser,
    });
  } catch (error) {
    next(error);
  }
};

export const logoutSpecificUser = async (req: any, res: Response, next: NextFunction): Promise<any> => {
  const currentUser = req.user;
  const { userId } = req.params;
  try {
    await UserServices.LogoutSpecificUserService(userId, currentUser);
    return CustomSuccess.send(res, "", StatusCodes.NO_CONTENT);
  } catch (error) {
    next(error);
  }
};

export const softDeleteUser = async (req: any, res: Response, next: NextFunction): Promise<any> => {
  const currentUser = req.user;
  const { userId } = req.params;
  try {
    await UserServices.SoftDeleteUserService(userId, currentUser);
    return CustomSuccess.send(res, "", StatusCodes.NO_CONTENT);
  } catch (error) {
    next(error);
  }
};

export const hardDeleteUser = async (req: any, res: Response, next: NextFunction): Promise<any> => {
  const currentUser = req.user;
  const { userId } = req.params;
  try {
    await UserServices.HardDeleteUserService(userId, currentUser);
    return CustomSuccess.send(res, "", StatusCodes.NO_CONTENT);
  } catch (error) {
    next(error);
  }
};

export const recoverUser = async (req: any, res: Response, next: NextFunction): Promise<any> => {
  const currentUser = req.user;
  const { userId } = req.params;
  try {
    await UserServices.RecoverUserService(userId, currentUser);
    return CustomSuccess.send(res, "", StatusCodes.NO_CONTENT);
  } catch (error) {
    next(error);
  }
};

export const getSettingDetails = async (req: any, res: Response, next: NextFunction): Promise<any> => {
  const {
    name,
    email,
    canLoginWithPassword,
    createdWith,
    picture,
    maxStorageLimit,
  } = req.user;
  const rootDir = await Directory.findById(req.user.rootDirId)
    .select("size")
    .lean();
  const usedStorage = rootDir?.size || 0;
  const settings = {
    name,
    email,
    picture,
    manualLogin: canLoginWithPassword,
    socialLogin: createdWith !== "email",
    socialProvider: createdWith === "email" ? null : createdWith,
    maxStorageLimit,
    usedStorageLimit: usedStorage,
    availableStorageLimit: maxStorageLimit - usedStorage,
  };
  return CustomSuccess.send(res, "", StatusCodes.OK, settings);
};

export const setPasswordForManualLogin = async (req: any, res: Response, next: NextFunction): Promise<any> => {
  const { password } = req.body;
  const userId = req.user._id;
  try {
    const parsedPassword = validateInputs(passwordSchema, password);
    await UserServices.SetPasswordService(userId, parsedPassword);
    return CustomSuccess.send(
      res,
      "Your password has been updated",
      StatusCodes.OK
    );
  } catch (error) {
    next(error);
  }
};

export const updatePassword = async (req: any, res: Response, next: NextFunction): Promise<any> => {
  const { oldPassword, newPassword } = req.body;
  const userId = req.user._id;
  try {
    const parsedOldPassword = validateInputs(passwordSchema, oldPassword);
    const parsedNewPassword = validateInputs(passwordSchema, newPassword);
    await UserServices.UpdatePasswordService(
      userId,
      parsedOldPassword,
      parsedNewPassword
    );
    return CustomSuccess.send(
      res,
      "Your password has been updated",
      StatusCodes.OK
    );
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (req: any, res: Response, next: NextFunction): Promise<any> => {
  const name = req.body.name;
  const userId = req.user._id;
  const file = req.file;
  try {
    const sanitizedName = sanitizeInput(name);
    await UserServices.UpdateProfileService(userId, file, sanitizedName);
    return CustomSuccess.send(res, "Profile Updated.", StatusCodes.OK);
  } catch (error) {
    next(error);
  }
};

export const disableUser = async (req: any, res: Response, next: NextFunction): Promise<any> => {
  const userId = req.user._id;
  try {
    await UserServices.DisableUserService(userId);
    return CustomSuccess.send(res, "", StatusCodes.NO_CONTENT);
  } catch (error) {
    next(error);
  }
};

export const deleteUser = async (req: any, res: Response, next: NextFunction): Promise<any> => {
  const userId = req.user._id;
  try {
    await UserServices.DeleteUserService(userId);
    return CustomSuccess.send(res, "", StatusCodes.NO_CONTENT);
  } catch (error) {
    next(error);
  }
};

export const changeRole = async (req: any, res: Response, next: NextFunction): Promise<any> => {
  const { userId } = req.params;
  const currentUser = req.user;
  const { newRole } = req.body;
  try {
    const parsedRole = validateInputs(roleSchema, newRole);
    const target_user = await UserServices.ChangeRoleService(
      parsedRole,
      currentUser,
      userId
    );
    return CustomSuccess.send(
      res,
      `${target_user.name} role has been changed to ${newRole}`,
      StatusCodes.OK
    );
  } catch (error) {
    next(error);
  }
};

export const getSpecificUserDirectory = async (req: any, res: Response, next: NextFunction): Promise<any> => {
  const { userId, dirId } = req.params;

  try {
    const directory = await UserServices.GetSpecificUserDirectoryService(
      userId,
      dirId || undefined
    );
    return CustomSuccess.send(res, "", StatusCodes.OK, directory);
  } catch (error) {
    next(error);
  }
};

export const getFile = async (req: any, res: any, next: any): Promise<void> => {
  const { userId, fileId } = req.params;
  try {
    const file = await UserServices.GetFileService(fileId, userId);
    req.file = file;
    next();
  } catch (error) {
    next(error);
  }
};
