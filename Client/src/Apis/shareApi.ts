import axios from "./axios";
import { ApiResponse } from "../types";

export const generateShareLinkApi = async (fileId: string, permission: string): Promise<ApiResponse> => {
  try {
    const response = await axios.post(`/file/share/${fileId}/link`, {
      enabled: true,
      permission,
    });
    return response?.data;
  } catch (error: any) {
    return error?.response?.data || { success: false, message: error.message };
  }
};

export const shareWithEmail = async (fileId: string, users: any[]): Promise<ApiResponse> => {
  try {
    const response = await axios.post(`/file/share/${fileId}/email`, { users });
    return response?.data;
  } catch (error: any) {
    return error?.response?.data || { success: false, message: error.message };
  }
};

export const toggleLink = async (fileId: string, enabled: boolean): Promise<ApiResponse> => {
  try {
    const response = await axios.patch(`/file/share/${fileId}/link/toggle`, {
      enabled,
    });
    return response?.data;
  } catch (error: any) {
    return error?.response?.data || { success: false, message: error.message };
  }
};

export const changePermissionApi = async (fileId: string, permission: string): Promise<ApiResponse> => {
  try {
    const response = await axios.patch(
      `/file/share/${fileId}/link/permission`,
      { permission }
    );
    return response?.data;
  } catch (error: any) {
    return error?.response?.data || { success: false, message: error.message };
  }
};

export const getSharedUserAccessList = async (fileId: string): Promise<ApiResponse> => {
  try {
    const response = await axios.get(`/file/share/access/${fileId}/list`);
    return response?.data;
  } catch (error: any) {
    return error?.response?.data || { success: false, message: error.message };
  }
};

export const getShareDashboardInfo = async (): Promise<ApiResponse> => {
  try {
    const response = await axios.get("/file/share/dashboard");
    return response?.data;
  } catch (error: any) {
    return error?.response?.data || { success: false, message: error.message };
  }
};

export const getViewFileByLink = async (fileId: string, token: string): Promise<ApiResponse> => {
  try {
    const response = await axios.get(`/file/share/${fileId}?token=${token}`);
    return response?.data;
  } catch (error: any) {
    return error?.response?.data || { success: false, message: error.message };
  }
};

export const changePermissionOfUserApi = async (fileId: string, userId: string, permission: string): Promise<ApiResponse> => {
  try {
    const response = await axios.patch(
      `/file/share/update/permission/${userId}/${fileId}`,
      { permission }
    );
    return response?.data;
  } catch (error: any) {
    return error?.response?.data || { success: false, message: error.message };
  }
};

export const revokeAccess = async (fileId: string, userId: string): Promise<ApiResponse> => {
  try {
    const response = await axios.patch(
      `/file/share/access/revoke/${userId}/${fileId}`
    );
    return response?.data;
  } catch (error: any) {
    return error?.response?.data || { success: false, message: error.message };
  }
};

export const getFileInfo = async (fileId: string): Promise<ApiResponse> => {
  try {
    const response = await axios.get(`/guest/file/${fileId}`);
    return response?.data;
  } catch (error: any) {
    return error?.response?.data || { success: false, message: error.message };
  }
};

export const getFilePermissionInfo = async (fileId: string): Promise<ApiResponse> => {
  try {
    const response = await axios.get(`/file/info/${fileId}`);
    return response?.data;
  } catch (error: any) {
    return error?.response?.data || { success: false, message: error.message };
  }
};

export const getSharedByMeFiles = async (): Promise<ApiResponse> => {
  try {
    const response = await axios.get(`/file/share/by-me`);
    return response?.data;
  } catch (error: any) {
    return error?.response?.data || { success: false, message: error.message };
  }
};

export const getSharedWithMeFiles = async (): Promise<ApiResponse> => {
  try {
    const response = await axios.get(`/file/share/with-me`);
    return response?.data;
  } catch (error: any) {
    return error?.response?.data || { success: false, message: error.message };
  }
};

export const renameFileSharedViaEmail = async (file: { _id: string }, newName: string): Promise<ApiResponse> => {
  try {
    const response = await axios.patch(`/file/share/edit/${file._id}`, {
      name: newName,
    });
    return response?.data;
  } catch (error: any) {
    return error?.response?.data || { success: false, message: error.message };
  }
};

export const renameFileSharedViaLink = async (file: { _id: string }, newName: string): Promise<ApiResponse> => {
  try {
    const response = await axios.patch(`/guest/share/edit/${file._id}/link`, {
      name: newName,
    });
    return response?.data;
  } catch (error: any) {
    return error?.response?.data || { success: false, message: error.message };
  }
};