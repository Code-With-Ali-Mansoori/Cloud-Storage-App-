import { Request, Response, NextFunction } from "express";
import { generatePreSigendGetURL } from "../services/file/s3Services";

export const serveFile = async (req: Request & { file?: any }, res: Response, next: NextFunction): Promise<void | Response> => {
  const fileObj = req.file;
  try {
    if (!fileObj?.originalKey) {
      throw new Error("File not found for download.");
    }

    const s3URL = await generatePreSigendGetURL({
      Key: fileObj.originalKey,
      Action: req.query.action as string,
      Filename: fileObj.name,
    });

    return res.redirect(s3URL);
  } catch (error) {
    next(error);
  }
};
