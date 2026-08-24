import { Request, Response, NextFunction } from "express";
import { StatusCodes } from "http-status-codes";
import path from "path";
import { sharedByMeFiles } from "../services/file/sharedByMeFiles";
import { sharedWithMeFiles } from "../services/file/sharedWithMeFiles";
import { FileServices } from "../services/index";
import { sanitizeInput } from "../utils/sanitizeInput";
import CustomSuccess from "../utils/SuccessResponse";
import { validateInputs } from "../utils/ValidateInputs";
import {
  enabledSchema,
  nameSchema,
  permissionSchema,
} from "../validators/commonValidation";
import {
  initiateFileUploadSchema,
  shareViaEmailSchema,
} from "../validators/fileSchema";
import CustomError from "../utils/ErrorResponse";

export const initiateFileUpload = async (req: any, res: Response, next: NextFunction): Promise<any> => {
  const { rootDirId, _id, maxStorageLimit } = req.user;
  try {
    const { name, size, contentType, parentDirId, isMultipart } =
      validateInputs(initiateFileUploadSchema, req.body) as any;

    const { uploadId, fileId, uploadURL } = await FileServices.UploadFileInitiateService(
      rootDirId,
      _id,
      maxStorageLimit,
      name,
      size,
      contentType,
      parentDirId,
      isMultipart
    );

    return CustomSuccess.send(res, "Upload initiated", StatusCodes.OK, {
      uploadId,
      fileId,
      uploadURL,
    });
  } catch (error) {
    next(error);
  }
};

export const getPresignedPartUploadURL = async (req: any, res: Response, next: NextFunction): Promise<any> => {
  const { fileId } = req.params;
  const { partNumber } = req.query;
  const userId = req.user._id;
  try {
    const uploadURL = await FileServices.GetPartPresignedURLService(
      fileId,
      parseInt(partNumber as string, 10),
      userId,
    );
    return CustomSuccess.send(
      res,
      "Presigned URL for part upload generated",
      StatusCodes.OK,
      { presignedURL: uploadURL }
    );
  } catch (error) {
    next(error);
  }
};

export const completeFileUpload = async (req: any, res: Response, next: NextFunction): Promise<any> => {
  const { fileId } = req.params;
  const parts = req.body?.parts || [];
  const userId = req.user._id;
  try {
    await FileServices.UploadFileCompleteService(fileId, userId, parts);
    return CustomSuccess.send(res, "File uploaded", StatusCodes.OK);
  } catch (error) {
    next(error);
  }
};

export const abortFileUpload = async (req: any, res: Response, next: NextFunction): Promise<any> => {
  const { fileId } = req.params;
  const userId = req.user._id;
  try {
    await FileServices.UploadFileAbortService(fileId, userId);
    return CustomSuccess.send(res, "File upload aborted", StatusCodes.OK);
  } catch (error) {
    next(error);
  }
};

export const getFileById = async (req: any, res: Response, next: NextFunction): Promise<any> => {
  const { id } = req.params;
  const userId = req.user._id;
  try {
    const file = await FileServices.GetFileService(id, userId);
    req.file = file;
    next();
  } catch (error) {
    next(error);
  }
};

export const renameFile = async (req: any, res: Response, next: NextFunction): Promise<any> => {
  const { id } = req.params;
  const { name } = req.body;
  const userId = req.user._id;
  try {
    const sanitizedData = sanitizeInput(name);
    const parsedName = validateInputs(nameSchema, sanitizedData);
    const renamedFile = await FileServices.RenameFileService(
      id,
      userId,
      parsedName
    );
    return CustomSuccess.send(res, "File renamed", StatusCodes.OK, renamedFile);
  } catch (error) {
    next(error);
  }
};

export const deleteFile = async (req: any, res: Response, next: NextFunction): Promise<any> => {
  const { id } = req.params;
  const userId = req.user._id;
  try {
    const deletedFile = await FileServices.DeleteFileService(id, userId);
    return CustomSuccess.send(res, "File deleted", StatusCodes.OK, deletedFile);
  } catch (error) {
    next(error);
  }
};

// Share File Controllers
export const shareViaEmail = async (req: any, res: Response, next: NextFunction): Promise<any> => {
  const file = req.file;
  const { users } = req.body;
  try {
    const parsedUsers = validateInputs(shareViaEmailSchema, users) as any[];
    const response = await FileServices.ShareViaEmailService(parsedUsers, file);
    return CustomSuccess.send(
      res,
      "File Shared with selected user.",
      StatusCodes.OK,
      { response }
    );
  } catch (error) {
    next(error);
  }
};

export const shareViaLink = async (req: any, res: Response, next: NextFunction): Promise<any> => {
  const file = req.file;
  const { permission } = req.body;
  try {
    const parsedPermission = validateInputs(permissionSchema, permission);
    const linkInfo = await FileServices.ShareviaLinkService(
      file,
      parsedPermission
    );
    return CustomSuccess.send(
      res,
      "Link generated for file.",
      StatusCodes.OK,
      linkInfo
    );
  } catch (error) {
    next(error);
  }
};

export const shareLinkToggle = async (req: any, res: Response, next: NextFunction): Promise<any> => {
  const file = req.file;
  const { enabled } = req.body;
  try {
    const parsedEnabled = validateInputs(enabledSchema, enabled);
    const permission = await FileServices.ShareLinkToggleService(
      file,
      parsedEnabled
    );
    return CustomSuccess.send(res, "", StatusCodes.OK, {
      permission,
      enabled,
    });
  } catch (error) {
    next(error);
  }
};

export const getSharedFileViaLink = async (req: any, res: Response, next: NextFunction): Promise<any> => {
  const { fileId } = req.params;
  const { token } = req.query;
  try {
    const file = await FileServices.GetSharedFileViaLinkService(fileId, token as string);
    req.file = file;
    next();
  } catch (error) {
    next(error);
  }
};

export const getFileInfoAndURL = async (req: any, res: Response, next: NextFunction): Promise<any> => {
  const fileId = req.params.fileId;
  const baseUrl = process.env.BASE_URL || "";
  try {
    const fileInfo = await FileServices.GetFileInfoService(fileId, baseUrl);
    return CustomSuccess.send(res, "", StatusCodes.OK, fileInfo);
  } catch (error) {
    next(error);
  }
};

export const getSharedFileViaEmail = async (req: any, res: Response, next: NextFunction): Promise<any> => {
  const { fileId } = req.params;
  const userId = req.user._id;
  try {
    const file = await FileServices.GetSharedFileViaEmailService(
      fileId,
      userId
    );
    req.file = file;
    next();
  } catch (error) {
    next(error);
  }
};

export const changePermission = async (req: any, res: Response, next: NextFunction): Promise<any> => {
  const file = req.file;
  const { permission } = req.body;
  try {
    const parsedPermission = validateInputs(permissionSchema, permission);
    const changedPermission =
      await FileServices.ChangeFileSharePermissionService(
        file,
        parsedPermission
      );
    return CustomSuccess.send(res, "", StatusCodes.OK, {
      permission: changedPermission,
    });
  } catch (error) {
    next(error);
  }
};

export const changePermissionOfUser = async (req: any, res: Response, next: NextFunction): Promise<any> => {
  const file = req.file;
  const { permission } = req.body;
  const { userId } = req.params;
  try {
    const parsedPermission = validateInputs(permissionSchema, permission);
    const changedPermission = await FileServices.ChangePermissionOfUserService(
      file,
      parsedPermission,
      userId
    );

    return CustomSuccess.send(
      res,
      "SuccessFully Updated the permission.",
      StatusCodes.OK,
      { permission: changedPermission }
    );
  } catch (error) {
    next(error);
  }
};

export const revokeUserAccess = async (req: any, res: Response, next: NextFunction): Promise<any> => {
  const { userId } = req.params;
  const file = req.file;
  try {
    await FileServices.RevokeUserAccessService(file, userId);
    return CustomSuccess.send(
      res,
      "SuccessFully removed the user.",
      StatusCodes.OK
    );
  } catch (error) {
    next(error);
  }
};

export const getUserAccessList = async (req: any, res: Response, next: NextFunction): Promise<any> => {
  const file = req.file;
  const userId = req.user._id;
  try {
    const { sharedUsers, availableUsers } =
      await FileServices.GetUserAccessListService(file._id, userId);
    return CustomSuccess.send(res, "", StatusCodes.OK, {
      sharedUsers,
      availableUsers,
    });
  } catch (error) {
    next(error);
  }
};

export const getDashboardInfo = async (req: any, res: Response, next: NextFunction): Promise<any> => {
  const currentUser = req.user;
  try {
    let sharedByMe = (await sharedByMeFiles(currentUser._id)) || [];
    sharedByMe = sharedByMe.map((f: any) => ({
      ...f,
      type: "sharedByMe",
    }));

    let sharedWithMe = (await sharedWithMeFiles(currentUser._id)) || [];
    sharedWithMe = sharedWithMe.map((f: any) => ({
      ...f,
      type: "sharedWithMe",
      latestTime: new Date(f.updatedAt || 0),
    }));

    const collaborators = new Set([
      ...sharedWithMe.map((file: any) => file?.userId?._id?.toString() || file?.userId?.toString()),
      ...sharedByMe.flatMap((file: any) =>
        file?.sharedWith?.map((u: any) => u?.userId?._id?.toString() || u?.userId?.toString())
      ),
    ]);

    const recentFiles = [...sharedByMe, ...sharedWithMe]
      .sort((a: any, b: any) => new Date(b.latestTime).getTime() - new Date(a.latestTime).getTime())
      .slice(0, 5);

    return CustomSuccess.send(res, "", StatusCodes.OK, {
      sharedByMeLength: sharedByMe.length,
      sharedWithMeLength: sharedWithMe.length,
      collaborators: collaborators.size,
      recentFiles: recentFiles.map((file: any) => {
        return {
          _id: file._id,
          name: file.name,
          isSharedViaLink: file?.sharedViaLink?.enabled,
          shareViaLink: file?.sharedViaLink,
          sharedWith: file?.sharedWith?.map((u: any) => {
            return {
              user: {
                _id: (u.userId as any)?._id,
                name: (u.userId as any)?.name,
                email: (u.userId as any)?.email,
                picture: (u.userId as any)?.picture,
              },
              permission: u.permission,
              sharedAt: u.sharedAt,
            };
          }),
          permission: file.sharedWith?.find((u: any) => {
            const uid = (u?.userId as any)?._id || u?.userId;
            return uid?.equals ? uid.equals(currentUser._id) : uid?.toString() === currentUser._id?.toString();
          })?.permission,
          sharedBy: {
            _id: (file.userId as any)?._id,
            name: (file.userId as any)?.name,
            email: (file.userId as any)?.email,
            picture: (file.userId as any)?.picture,
          },
          latestTime: new Date(file.updatedAt),
          type: (file as any).type,
          fileType: path.extname(file.name),
        };
      }),
    });
  } catch (error) {
    next(error);
  }
};

export const getFileInfoById = async (req: any, res: Response, next: NextFunction): Promise<any> => {
  const file = req.file;

  try {
    return CustomSuccess.send(res, "", StatusCodes.OK, {
      fileInfo: {
        ...file._doc,
        fileType: path.extname(file.name),
        size: file.size,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getSharedByMeFiles = async (req: any, res: Response, next: NextFunction): Promise<any> => {
  const currentUser = req.user;
  try {
    return CustomSuccess.send(res, "", StatusCodes.OK, {
      sharedByMeFiles: (await sharedByMeFiles(currentUser._id)).map((file: any) => {
        return {
          _id: file._id,
          name: file.name,
          isSharedViaLink: file.sharedViaLink?.enabled,
          shareViaLink: file.sharedViaLink,
          sharedWith: file.sharedWith.map((u: any) => {
            return {
              user: {
                _id: (u.userId as any)?._id,
                name: (u.userId as any)?.name,
                email: (u.userId as any)?.email,
                picture: (u.userId as any)?.picture,
              },
              permission: u.permission,
              sharedAt: u.sharedAt,
            };
          }),
          latestTime: file.latestTime,
          type: "sharedByMe",
          fileType: path.extname(file.name),
          size: file.size,
        };
      }),
    });
  } catch (error) {
    next(error);
  }
};

export const getSharedWithMeFiles = async (req: any, res: Response, next: NextFunction): Promise<any> => {
  const currentUser = req.user;
  try {
    return CustomSuccess.send(res, "", StatusCodes.OK, {
      sharedWithMe: (await sharedWithMeFiles(currentUser._id)).map((file: any) => {
        return {
          _id: file._id,
          name: file.name,
          permission: file.sharedWith.find((u: any) => {
            const uid = u.userId?._id ? u.userId._id : u.userId;
            return uid?.equals ? uid.equals(currentUser._id) : uid?.toString() === currentUser._id?.toString();
          })?.permission,
          sharedBy: {
            _id: (file.userId as any)?._id,
            name: (file.userId as any)?.name,
            email: (file.userId as any)?.email,
            picture: (file.userId as any)?.picture,
          },
          latestTime: new Date(file.updatedAt),
          fileType: path.extname(file.name),
          size: file.size,
        };
      }),
    });
  } catch (error) {
    next(error);
  }
};

export const renameFileSharedViaEmail = async (req: any, res: Response, next: NextFunction): Promise<any> => {
  const file = req.file;
  const { name } = req.body;
  try {
    const sanitizedData = sanitizeInput(name);
    const parsedName = validateInputs(nameSchema, sanitizedData);
    const newFileName = await FileServices.RenameFileByEditorService(
      file,
      parsedName
    );
    return CustomSuccess.send(res, "", StatusCodes.OK, { name: newFileName });
  } catch (error) {
    next(error);
  }
};

export const renameFileSharedViaLink = async (req: any, res: Response, next: NextFunction): Promise<any> => {
  const file = req.file;
  const { name } = req.body;
  try {
    const sanitizedData = sanitizeInput(name);
    const parsedName = validateInputs(nameSchema, sanitizedData);
    const newFileName = await FileServices.RenameFileByEditorService(
      file,
      parsedName
    );
    return CustomSuccess.send(res, "", StatusCodes.OK, { name: newFileName });
  } catch (error) {
    next(error);
  }
};

export const importFromDrive = async (req: any, res: Response, next: NextFunction): Promise<any> => {
  const { rootDirId, _id, maxStorageLimit } = req.user;
  const { token, filesMetaData, fileForUploading } = req.body;
  if (
    !token ||
    !Array.isArray(filesMetaData) ||
    filesMetaData.length === 0 ||
    !fileForUploading
  )
    throw new CustomError("Invalid input data", StatusCodes.BAD_REQUEST);

  try {
    const result = await FileServices.ImportFileFromGoogleService(
      rootDirId,
      maxStorageLimit,
      _id,
      fileForUploading,
      filesMetaData,
      token
    );

    return CustomSuccess.send(res, "", StatusCodes.CREATED, {
      result,
    });
  } catch (error) {
    next(error);
  }
};
