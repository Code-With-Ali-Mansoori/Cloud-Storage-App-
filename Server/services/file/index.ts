import { StatusCodes } from "http-status-codes";
import { extname } from "node:path";
import mongoose from "mongoose";
import Directory from "../../models/dirModel";
import File from "../../models/fileModel";
import User from "../../models/userModel";
import CustomError from "../../utils/ErrorResponse";
import {
  abortMultipartUpload,
  completeMultipartUpload,
  deleteS3Object,
  deleteS3Objects,
  generatePartPresignedURL,
  generatePreSignedUploadURL,
  getFileContentLength,
  initiateMultipartUpload,
} from "./s3Services";
import { formatFileSize } from "../../utils/formatFileSize";

export const updateParentDirectorySize = async (
  parentDirectoryId: any,
  deltaSize: number
): Promise<void> => {
  const parents = [];

  while (parentDirectoryId) {
    const parentDirectory = await Directory.findById(
      parentDirectoryId,
      "parentDirId"
    );
    if (!parentDirectory) break;
    parents.push(parentDirectory._id);
    parentDirectoryId = parentDirectory.parentDirId;
  }

  if (parents.length > 0) {
    await Directory.updateMany(
      { _id: { $in: parents } },
      { $inc: { size: deltaSize } }
    );
  }
};

/**
 * Upload file initiation (determines simple or multipart based on file size)
 */
export const uploadFileInitiateService = async (
  rootDirId: any,
  userId: any,
  maxStorageLimit: number,
  name: string,
  size: number,
  contentType: string,
  parentDirId?: any,
  isMultipart?: boolean
): Promise<any> => {
  // Validate directory and storage space
  const rootDirectory = await Directory.findOne({
    _id: rootDirId,
    userId,
  })
    .select("size")
    .lean();

  const user = await User.findById(userId).select("maxFileSize").lean();

  if (!rootDirectory) {
    throw new CustomError("Root directory not found.", StatusCodes.NOT_FOUND);
  }

  const maxFileSize = user?.maxFileSize || 104857600;
  if (size > maxFileSize) {
    throw new CustomError(
      `${name} size is larger than the file upload limit.`,
      StatusCodes.FORBIDDEN
    );
  }

  if (rootDirectory.size + size > maxStorageLimit) {
    throw new CustomError(
      `${name} size is larger than available space.`,
      StatusCodes.FORBIDDEN
    );
  }

  let targetDirectory: any = rootDirectory;

  if (parentDirId && parentDirId !== String(rootDirId)) {
    targetDirectory = await Directory.findOne({
      _id: parentDirId,
      userId,
    }).lean();

    if (!targetDirectory) {
      throw new CustomError(
        "You are not authorized to upload in this directory.",
        StatusCodes.UNAUTHORIZED
      );
    }
  }

  const fileExt = extname(name);
  const fileId = new mongoose.Types.ObjectId();
  const uploadKey = `${fileId}${fileExt}`;

  const newFile = await File.create({
    _id: fileId,
    userId,
    size,
    name,
    parentDirId: targetDirectory._id,
    isUploading: true,
    originalKey: uploadKey,
    uploadId: null,
    isMultipart,
  });

  if (isMultipart) {
    // Initiate multipart upload on S3
    const uploadId = await initiateMultipartUpload({
      Key: uploadKey,
      ContentType: contentType,
    });

    // Update file with uploadId
    await File.updateOne({ _id: fileId }, { uploadId });

    return { uploadId, fileId: String(fileId), uploadURL: null };
  } else {
    // Generate presigned URL for simple PUT upload
    const uploadURL = await generatePreSignedUploadURL({
      Key: uploadKey,
      ContentType: contentType,
    });

    return { uploadId: null, fileId: String(fileId), uploadURL };
  }
};

/**
 * Get presigned URL for a specific part in multipart upload
 */
export const getPartPresignedURLService = async (
  fileId: string,
  partNumber: number,
  userId: string
): Promise<string> => {
  const file = await File.findOne({
    _id: fileId,
    userId,
    isUploading: true,
    isMultipart: true,
  });

  if (!file) {
    throw new CustomError(
      "File not found or is not a multipart upload.",
      StatusCodes.BAD_REQUEST
    );
  }

  if (!file.uploadId) {
    throw new CustomError(
      "Multipart upload not initialized.",
      StatusCodes.BAD_REQUEST
    );
  }

  const presignedURL = await generatePartPresignedURL({
    Key: file.originalKey,
    uploadId: file.uploadId,
    partNumber,
  });

  return presignedURL;
};

/**
 * Complete file upload (handles both simple and multipart)
 */
export const uploadFileCompleteService = async (
  fileId: string,
  userId: string,
  parts: any[] = [],
): Promise<any> => {
  const file = await File.findOne({
    _id: fileId,
    userId,
    isUploading: true,
  })

  if (!file) {
    throw new CustomError("File not found.", StatusCodes.BAD_REQUEST)
  }

  try {
    if (file.isMultipart) {
      // Complete multipart upload
      if (!file.uploadId) {
        throw new CustomError("Multipart upload ID not found.", StatusCodes.BAD_REQUEST)
      }

      if (!parts || parts.length === 0) {
        throw new CustomError("No parts provided for multipart completion.", StatusCodes.BAD_REQUEST)
      }

      await completeMultipartUpload({
        Key: file.originalKey,
        uploadId: file.uploadId,
        parts,
      })
    } else {
      // Verify simple upload
      const contentLength = await getFileContentLength({
        Key: file.originalKey,
      })

      if (contentLength !== file.size) {
        await deleteS3Object({ Key: file.originalKey })
        await file.deleteOne()
        throw new CustomError(
          `File length mismatch. Expected ${file.size}, got ${contentLength}`,
          StatusCodes.BAD_REQUEST,
        )
      }
    }

    // Mark file as uploaded and update directory size
    file.isUploading = false
    await file.save()
    await updateParentDirectorySize(file.parentDirId, file.size)
  } catch (error) {
    // Clean up on error
    if (file.isMultipart && file.uploadId) {
      try {
        await abortMultipartUpload({
          Key: file.originalKey,
          uploadId: file.uploadId,
        })
      } catch (abortErr) {
        console.error("Failed to abort multipart upload:", abortErr)
      }
    }
    throw error
  }
}

/**
 * Abort multipart upload
 */
export const abortUploadService = async (fileId: string, userId: string): Promise<void> => {
  const file = await File.findOne({
    _id: fileId,
    userId,
  })

  if (!file) {
    throw new CustomError("File not found.", StatusCodes.BAD_REQUEST)
  }

  if (!file.isMultipart || !file.uploadId) {
    throw new CustomError("This is not a multipart upload.", StatusCodes.BAD_REQUEST)
  }

  await abortMultipartUpload({
    Key: file.originalKey,
    uploadId: file.uploadId,
  })

  await file.deleteOne()
}

const getFileService = async (id: string, userId: string): Promise<any> => {
  const file = await File.findOne({
    _id: id,
    userId,
  });

  if (!file) {
    throw new CustomError("File not found", StatusCodes.NOT_FOUND);
  }

  return file;
};

const renameFileService = async (id: string, userId: string, name: string): Promise<any> => {
  const file = await File.findOne({
    _id: id,
    userId,
  }).lean();

  if (!file) {
    throw new CustomError("File not found", StatusCodes.NOT_FOUND);
  }
  await File.updateOne({ _id: file._id }, { $set: { name } }).lean();

  return file;
};

const deleteFileService = async (id: string, userId: string): Promise<any> => {
  const file = await File.findOne({
    _id: id,
    userId,
  });

  if (!file) {
    throw new CustomError("File not found", StatusCodes.NOT_FOUND);
  }

  await deleteS3Object({
    Key: file.originalKey,
  });

  await File.deleteOne({ _id: file._id });

  await updateParentDirectorySize(file.parentDirId, -file.size);

  return file;
};

const shareViaEmailService = async (users: any[], file: any): Promise<string[]> => {
  let response: string[] = [];
  for (const { email, name, permission } of users) {
    const user = await User.findOne({ email }).lean();

    if (!user) {
      response.push(
        `${name} -> ${email} is not registered, file cannot be shared.`
      );
      continue;
    }

    const alreadyShared = file.sharedWith.find(
      (u: any) => (u.userId?._id ? u.userId._id.toString() : u.userId.toString()) === user._id.toString()
    );

    if (alreadyShared) {
      response.push(`${name} -> File already shared with ${email}.`);
      continue;
    }

    file.sharedWith.push({
      permission,
      userId: user._id,
    });
  }
  await file.save();

  return response;
};

const shareviaLinkService = async (file: any, permission: string): Promise<any> => {
  if (file?.sharedViaLink?.token) {
    return {
      link: `${process.env.DEFAULT_CLIENT_URL}/guest/access/${file._id}?token=${file.sharedViaLink.token}`,
      permission: file.sharedViaLink.permission,
      enabled: file.sharedViaLink.enabled,
    };
  }

  file.sharedViaLink = {
    enabled: false,
    permission,
    token: crypto.randomUUID(),
  };

  await file.save();

  return {
    link: `${process.env.DEFAULT_CLIENT_URL}/guest/access/${file._id}?token=${file.sharedViaLink.token}`,
    permission: file.sharedViaLink.permission,
    enabled: file.sharedViaLink.enabled,
  };
};

const shareLinkToggleService = async (file: any, enabled: boolean): Promise<any> => {
  if (!file.sharedViaLink) {
    file.sharedViaLink = {};
  }
  file.sharedViaLink.enabled = enabled;
  await file.save();

  return file.sharedViaLink.permission;
};

const getSharedFileViaLinkService = async (fileId: string, token: string): Promise<any> => {
  const file = await File.findById(fileId).lean();
  if (!file) {
    throw new CustomError("File not found", StatusCodes.NOT_FOUND);
  }

  if (!file.sharedViaLink?.enabled) {
    throw new CustomError(
      "File access has been disabled by the user.",
      StatusCodes.CONFLICT
    );
  }

  if (file.sharedViaLink?.token !== token) {
    throw new CustomError("File Access token is Invalid", StatusCodes.CONFLICT);
  }

  return file;
};

const getFileInfoService = async (fileId: string, baseUrl: string): Promise<any> => {
  const file = await File.findById(fileId)
    .select("name sharedViaLink userId")
    .populate("userId");

  if (!file) {
    throw new CustomError("File not found", StatusCodes.NOT_FOUND);
  }

  const url = `${baseUrl}/guest/file/view/${file._id}?token=${file.sharedViaLink?.token || ""}`;

  return {
    _id: file._id,
    url,
    name: file.name,
    sharedBy: (file.userId as any)?.name || "",
    isAccessible: file.sharedViaLink?.enabled || false,
    permission: file.sharedViaLink?.permission || "viewer",
  };
};

const getSharedFileViaEmailService = async (fileId: string, userId: any): Promise<any> => {
  const file = await File.findById(fileId).lean();
  if (!file) {
    throw new CustomError("File not found", StatusCodes.NOT_FOUND);
  }

  const hasAccess = file.sharedWith.find((u: any) => {
    const id = u.userId?._id ? u.userId._id : u.userId;
    return userId.equals ? userId.equals(id) : userId.toString() === id.toString();
  });

  if (!hasAccess) {
    throw new CustomError(
      "You are not authorized to access this file.",
      StatusCodes.UNAUTHORIZED
    );
  }

  return file;
};

const changeFileSharePermissionService = async (file: any, permission: string): Promise<string> => {
  file.sharedViaLink.permission = permission;
  await file.save();

  return file.sharedViaLink.permission;
};

const changePermissionOfUserService = async (file: any, permission: string, userId: string): Promise<string> => {
  // Checking if the given user exist in the shared list.
  const collaborator = file.sharedWith.find(
    (c: any) => c.userId?._id?.toString() === userId || c.userId?.toString() === userId
  );
  if (!collaborator) {
    throw new CustomError(
      "File is not shared with the selected user.",
      StatusCodes.CONFLICT
    );
  }

  collaborator.permission = permission;
  await file.save();

  return collaborator.permission;
};

const revokeUserAccessService = async (file: any, userId: string): Promise<void> => {
  // Checking if the given user exist in the list.
  const collaborator = file.sharedWith.find(
    (c: any) => c.userId?._id?.toString() === userId || c.userId?.toString() === userId
  );
  if (!collaborator) {
    throw new CustomError(
      "File is not shared with the selected user.",
      StatusCodes.CONFLICT
    );
  }

  file.sharedWith = file.sharedWith.filter(
    (c: any) => c.userId?._id?.toString() !== userId && c.userId?.toString() !== userId
  );
  await file.save();
};

const getUserAccessListService = async (fileId: string, userId: any): Promise<any> => {
  const sharedUsers =
    (
      await File.findById(fileId)
        .populate("sharedWith.userId", "name email picture")
        .select("sharedWith.userId sharedWith.permission sharedWith.sharedAt")
        .lean()
    )?.sharedWith || [];

  const allUsers = (
    await User.find().select("name email picture").lean()
  ).filter((u: any) => (userId.equals ? !userId.equals(u._id) : userId.toString() !== u._id.toString()));

  const sharedUserIdArray = sharedUsers.map((u: any) => u.userId?._id ? u.userId._id.toString() : u.userId?.toString() || "");

  const availableUsers = allUsers.filter(
    (u: any) => !sharedUserIdArray.includes(u._id.toString())
  );

  return {
    sharedUsers,
    availableUsers,
  };
};

const renameFileByEditorService = async (file: any, name: string): Promise<string> => {
  file.name = name;
  await file.save();
  return file.name;
};

export default {
  UploadFileInitiateService: uploadFileInitiateService,
  UploadFileCompleteService: uploadFileCompleteService,
  GetFileService: getFileService,
  RenameFileService: renameFileService,
  DeleteFileService: deleteFileService,
  ShareViaEmailService: shareViaEmailService,
  ShareviaLinkService: shareviaLinkService,
  ShareLinkToggleService: shareLinkToggleService,
  GetSharedFileViaLinkService: getSharedFileViaLinkService,
  GetFileInfoService: getFileInfoService,
  GetSharedFileViaEmailService: getSharedFileViaEmailService,
  ChangeFileSharePermissionService: changeFileSharePermissionService,
  ChangePermissionOfUserService: changePermissionOfUserService,
  RevokeUserAccessService: revokeUserAccessService,
  GetUserAccessListService: getUserAccessListService,
  RenameFileByEditorService: renameFileByEditorService,
  GetPartPresignedURLService: getPartPresignedURLService,
  UploadFileAbortService: abortUploadService,
};
