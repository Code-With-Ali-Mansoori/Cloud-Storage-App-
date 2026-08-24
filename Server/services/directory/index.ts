import { StatusCodes } from "http-status-codes";
import mongoose from "mongoose";
import { extname } from "path";
import Directory from "../../models/dirModel";
import File from "../../models/fileModel";
import CustomError from "../../utils/ErrorResponse";
import { generateBreadCrumb, generatePath } from "../../utils/generatePath";
import { updateParentDirectorySize } from "../file/index";
import { deleteS3Objects } from "../file/s3Services";
import { collectDirectoryContents } from "./collectDirectoryContents";

const getDirectoryDataService = async (userId: string, dirId: string | null = null): Promise<any> => {
  try {
    const directoryData: any = dirId
      ? await Directory.findOne({
          _id: dirId,
          userId,
        })
          .populate("path")
          .lean()
      : await Directory.findOne({
          userId,
          parentDirId: null,
        })
          .populate("path")
          .lean();

    if (!directoryData)
      throw new CustomError(
        "You are not authorized to make this action",
        StatusCodes.UNAUTHORIZED
      );

    const typedPath = (directoryData.path || []).map((p: any) => ({
      _id: p._id || p,
      name: p.name || String(p._id || p),
    }));

    const files = (
      await File.find({
        parentDirId: directoryData?._id,
        isUploading: false,
      }).lean()
    ).map((file: any) => ({
      ...file,
      ...{
        type: "file",
        path: generatePath([...typedPath, { _id: file._id, name: file.name }]),
      },
    }));

    const childDirs = await Directory.find({
      parentDirId: directoryData?._id,
    }).lean();

    const directories = await Promise.all(
      childDirs.map(async (dir: any) => {
        const [fileCounts, dirCounts] = await Promise.all([
          await File.countDocuments({
            parentDirId: dir._id,
            isUploading: false,
          }),
          await Directory.countDocuments({ parentDirId: dir._id }),
        ]);

        return {
          ...dir,
          ...{
            type: "directory",
            path: generatePath([...typedPath, { _id: dir._id, name: dir.name }]),
            files: fileCounts,
            directories: dirCounts,
          },
        };
      })
    );

    return {
      ...directoryData,
      files,
      directory: directories,
      breadCrumb: generateBreadCrumb(typedPath),
    };
  } catch (error) {
    throw error;
  }
};

export const updateDirectoryDataService = async (userId: string, dirId: string, name: string): Promise<void> => {
  try {
    await Directory.findOneAndUpdate(
      { _id: dirId, userId },
      { $set: { name } },
      { new: true, runValidators: true }
    );
  } catch (error) {
    throw error;
  }
};

const createDirectoryService = async (parentDirId: string, userId: string, dirname: string): Promise<any> => {
  try {
    const parentDirectory = await Directory.findOne({
      _id: parentDirId,
      userId,
    }).lean();

    if (!parentDirectory)
      throw new CustomError(
        "You are not authorized to make this action",
        StatusCodes.UNAUTHORIZED
      );

    const newId = new mongoose.Types.ObjectId();
    const dir = new Directory({
      _id: newId,
      name: dirname,
      parentDirId,
      userId: parentDirectory.userId,
      path: [...(parentDirectory.path || []), newId],
    });

    await dir.save();

    return dir;
  } catch (error) {
    throw error;
  }
};

const deleteDirectoryService = async (dirId: string, userId: string): Promise<void> => {
  try {
    const dirObj = await Directory.findOne({ _id: dirId, userId })
      .select("_id parentDirId size")
      .lean();

    if (!dirObj) {
      throw new CustomError(
        "You are not authorized to make this action",
        StatusCodes.UNAUTHORIZED
      );
    }

    const { files, directories } = await collectDirectoryContents(dirId);

    // Delete all files from S3;
    if (files.length > 1) {
      const keys: Array<{ Key: string }> = [];
      files.map((file: any) => {
        if (file.googleFileId && file.pdfKey) {
          keys.push({
            Key: file.pdfKey,
          });
        }

        keys.push({
          Key: file.originalKey,
        });
      });

      await deleteS3Objects({
        Keys: keys,
      });
    }

    const includeThisDir = [
      ...(directories?.map((dir) => dir._id) || []),
      dirId,
    ];

    await Directory.deleteMany({ _id: { $in: includeThisDir } });

    await File.deleteMany({ _id: { $in: files?.map((file) => file._id) } });
    await updateParentDirectorySize(dirObj.parentDirId, -dirObj.size);
  } catch (error) {
    throw error;
  }
};

export default {
  GetDirectoryDataService: getDirectoryDataService,
  UpdateDirectoryDataService: updateDirectoryDataService,
  CreateDirectoryService: createDirectoryService,
  DeleteDirectoryService: deleteDirectoryService,
};
