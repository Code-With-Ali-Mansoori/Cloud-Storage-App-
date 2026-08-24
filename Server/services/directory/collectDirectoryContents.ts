import Directory from "../../models/dirModel";
import File from "../../models/fileModel";

// Recursively finds all child directories & files under a given directory
export const collectDirectoryContents = async (dirId: any): Promise<{ directories: any[]; files: any[] }> => {
  let directories = await Directory.find(
    { parentDirId: dirId },
    { projection: { _id: 1 } }
  ).lean();

  let files = await File.find({ parentDirId: dirId })
    .select("googleFileId name originalKey pdfKey")
    .lean();

  for (const { _id } of directories) {
    const { directories: childDirs, files: childFiles } =
      await collectDirectoryContents(_id);

    files = [...files, ...childFiles];
    directories = [...directories, ...childDirs];
  }

  return { directories, files };
};
