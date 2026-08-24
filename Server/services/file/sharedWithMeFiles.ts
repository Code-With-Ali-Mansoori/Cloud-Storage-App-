import File from "../../models/fileModel";

export const sharedWithMeFiles = async (currentUserId: string): Promise<any[]> => {
  return await File.find({
    "sharedWith.userId": currentUserId,
  })
    .populate("userId sharedWith.userId")
    .lean();
};