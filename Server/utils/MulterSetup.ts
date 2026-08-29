import fs from "fs";
import multer from "multer";
import path from "path";

const profilePicturesDir = path.resolve(import.meta.dirname, "..", "profilePictures");
fs.mkdirSync(profilePicturesDir, { recursive: true });

export const profileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    fs.mkdirSync(profilePicturesDir, { recursive: true });
    cb(null, profilePicturesDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const randomID = crypto.randomUUID();
    const fullFileName = `${randomID}${ext}`;
    file.ext = ext;
    file.storedName = fullFileName;
    cb(null, fullFileName);
  },
});
