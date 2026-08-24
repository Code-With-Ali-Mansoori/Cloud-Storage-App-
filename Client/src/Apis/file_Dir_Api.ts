import axios from "./axios";
import { ApiResponse, DirectoryItem } from "../types";

export const deleteFile_or_Directory = async (item: { type: string; _id: string }): Promise<ApiResponse> => {
  try {
    const response = await axios.delete(`/${item.type}/${item._id}`);
    return response.data;
  } catch (error: any) {
    return error?.response?.data || { success: false, message: error.message };
  }
};

export const renameFile_or_Directory = async (item: { type: string; _id: string }, name: string): Promise<ApiResponse> => {
  try {
    const response = await axios.patch(`/${item.type}/${item._id}`, { name });
    return response.data;
  } catch (error: any) {
    return error?.response?.data || { success: false, message: error.message };
  }
};

export const getItemList = async (dirId?: string): Promise<ApiResponse> => {
  try {
    const response = await axios.get(`/directory/${dirId || ""}`);
    return response.data;
  } catch (error: any) {
    return error?.response?.data || { success: false, message: error.message };
  }
};

export const createDirectory = async (dirId: string | null | undefined, directoryName: string): Promise<ApiResponse> => {
  try {
    const response = await axios.post(
      `/directory/${dirId || ""}`,
      {},
      {
        headers: {
          dirname: directoryName,
        },
      }
    );
    return response.data;
  } catch (error: any) {
    return error?.response?.data || { success: false, message: error.message };
  }
};

export interface DriveConnectParams {
  token: string;
  filesMetaData: any[];
  fileForUploading?: any;
}

export const driveConnect = async ({ token, filesMetaData, fileForUploading }: DriveConnectParams): Promise<ApiResponse> => {
  try {
    const response = await axios.post("/file/drive-import", {
      token,
      filesMetaData,
      fileForUploading,
    });
    return response.data;
  } catch (error: any) {
    return error?.response?.data || { success: false, message: error.message };
  }
};