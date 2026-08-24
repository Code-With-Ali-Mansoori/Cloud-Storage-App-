import File from "../../models/fileModel";

export const sharedByMeFiles = async (currentUserId: string): Promise<any[]> => {
  const sharedByMe = await File.find({
    userId: currentUserId,
    $or: [
      { "sharedViaLink.enabled": true },
      { sharedWith: { $not: { $size: 0 } } },
    ],
  })
    .populate("userId sharedWith.userId")
    .lean();

  return sharedByMe.map((f: any) => {
    const lastSharedAt = f.sharedWith?.at(-1)?.sharedAt;
    const modifiedAt = f.updatedAt;
    const modTime = modifiedAt ? new Date(modifiedAt).getTime() : 0;
    const sharedTime = lastSharedAt ? new Date(lastSharedAt).getTime() : 0;
    const latestTime = new Date(modTime > sharedTime ? modTime : sharedTime);
    return { ...f, latestTime };
  });
};
