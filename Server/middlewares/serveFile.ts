import { Request, Response, NextFunction } from "express";
import { getCloudFrontSignedURL } from "../services/file/cloudFront";

export const serveFile = async (req: Request & { file?: any }, res: Response, next: NextFunction): Promise<void | Response> => {
  const fileObj = req.file;
  try {
    const s3URL = getCloudFrontSignedURL({
      File: fileObj,
      Action: req.query.action as string,
    });

    return res.redirect(s3URL);
  } catch (error) {
    next(error);
  }
};
