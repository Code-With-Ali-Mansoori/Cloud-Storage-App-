import axios from "./axios";
import { ApiResponse } from "../types";

export const softDelete = async (userId: string): Promise<ApiResponse> => {
  try {
    const response = await axios.delete(`/user/${userId}/delete/soft`);
    return { success: true, ...response.data };
  } catch (error: any) {
    return error?.response?.data || { success: false, message: error.message };
  }
};

export const hardDelete = async (userId: string): Promise<ApiResponse> => {
  try {
    const response = await axios.delete(`/user/${userId}/delete/hard`);
    return { success: true, ...response.data };
  } catch (error: any) {
    return error?.response?.data || { success: false, message: error.message };
  }
};

export const logout = async (userId: string): Promise<ApiResponse> => {
  try {
    const response = await axios.post(`/user/${userId}/logout`);
    return { success: true, ...response.data };
  } catch (error: any) {
    return error?.response?.data || { success: false, message: error.message };
  }
};

export const recover = async (userId: string): Promise<ApiResponse> => {
  try {
    const response = await axios.patch(`/user/${userId}/recover`);
    return { success: true, ...response.data };
  } catch (error: any) {
    return error?.response?.data || { success: false, message: error.message };
  }
};

export const changeRole = async (userId: string, role: string): Promise<ApiResponse> => {
  try {
    const response = await axios.post(`/user/${userId}/changeRole`, {
      newRole: role,
    });
    return response.data;
  } catch (error: any) {
    return error?.response?.data || { success: false, message: error.message };
  }
};

export const getUserDirectory = async (userId: string, dirId?: string): Promise<ApiResponse> => {
  try {
    const response = await axios.get(`/user/${userId}/${dirId || ""}`);
    return response.data;
  } catch (error: any) {
    return error?.response?.data || { success: false, message: error.message };
  }
};
