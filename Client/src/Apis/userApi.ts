import axios from "./axios";
import { ApiResponse } from "../types";

export const getUserDetails = async (): Promise<ApiResponse> => {
  try {
    const response = await axios.get("/user");
    return response.data;
  } catch (error: any) {
    return error?.response?.data || { success: false, message: error.message };
  }
};

export const disableAccount = async (): Promise<ApiResponse> => {
  try {
    const response = await axios.patch("/user/disable");
    return { success: true, ...response.data };
  } catch (error: any) {
    return error?.response?.data || { success: false, message: error.message };
  }
};

export const deleteAccount = async (): Promise<ApiResponse> => {
  try {
    const response = await axios.delete("/user/delete");
    return { success: true, ...response.data };
  } catch (error: any) {
    return error?.response?.data || { success: false, message: error.message };
  }
};

export const UserSettings = async (): Promise<ApiResponse> => {
  try {
    const response = await axios.get("/user/settings");
    return response.data;
  } catch (error: any) {
    return error?.response?.data || { success: false, message: error.message };
  }
};

export const UpdateUserSettings = async (formData: FormData): Promise<ApiResponse> => {
  try {
    const response = await axios.post("/user/updateProfile", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  } catch (error: any) {
    return error?.response?.data || { success: false, message: error.message };
  }
};

export const getAllUsers = async (): Promise<ApiResponse> => {
  try {
    const response = await axios.get("/user/all-users");
    return response.data;
  } catch (error: any) {
    return error?.response?.data || { success: false, message: error.message };
  }
};
