import path from "path";
import mime from "mime-types";

export function getFileExtension(originalName: string, mimeType: string): string {
  let ext = path.extname(originalName);

  // If still no extension, fallback to mime-types lib
  if (!ext) {
    const mimeExt = mime.extension(mimeType);
    ext = mimeExt ? `.${mimeExt}` : ".bin";
  }

  return ext;
}

