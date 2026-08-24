import axios from "./axios";
import { ApiResponse } from "../types";

export const googleAuth = async (code: string): Promise<ApiResponse> => {
  try {
    const response = await axios.post("/auth/google", { code });
    return response.data;
  } catch (error: any) {
    return error?.response?.data || { success: false, message: error.message };
  }
};

export const sendOTP = async (email: string, action: string, password?: string): Promise<ApiResponse> => {
  try {
    const response = await axios.post("/otp/send-otp", {
      email,
      password,
      action,
    });
    return response.data;
  } catch (error: any) {
    return error?.response?.data || { success: false, message: error.message };
  }
};

export const register = async (name: string, email: string, password?: string, otp?: string): Promise<ApiResponse> => {
  try {
    const response = await axios.post("/auth/register", {
      name,
      email,
      password,
      otp,
    });
    return response.data;
  } catch (error: any) {
    return error?.response?.data || { success: false, message: error.message };
  }
};

export const login = async (email: string, password?: string, otp?: string): Promise<ApiResponse> => {
  try {
    const response = await axios.post("/auth/login", { email, password, otp });
    return response.data;
  } catch (error: any) {
    return error?.response?.data || { success: false, message: error.message };
  }
};

export const setPassword = async (password: string): Promise<ApiResponse> => {
  try {
    const response = await axios.patch("/user/setPassword", { password });
    return response.data;
  } catch (error: any) {
    return error?.response?.data || { success: false, message: error.message };
  }
};

export const updatePassword = async (oldPassword: string, newPassword: string): Promise<ApiResponse> => {
  try {
    const response = await axios.patch("/user/updatePassword", {
      oldPassword,
      newPassword,
    });
    return response.data;
  } catch (error: any) {
    return error?.response?.data || { success: false, message: error.message };
  }
};

export const logout = async (): Promise<ApiResponse> => {
  try {
    const response = await axios.post("/user/logout");
    return { success: true, ...response.data };
  } catch (error: any) {
    return error?.response?.data || { success: false, message: error.message };
  }
};

export const logoutAll = async (): Promise<ApiResponse> => {
  try {
    const response = await axios.post("/user/logout-all");
    return { success: true, ...response.data };
  } catch (error: any) {
    return error?.response?.data || { success: false, message: error.message };
  }
};

export const isAuthenticated = async (): Promise<ApiResponse> => {
  try {
    const response = await axios.get("/user");
    return { success: true, ...response.data };
  } catch (error: any) {
    return error?.response?.data || { success: false, message: error.message };
  }
};

export const regenerateSession = async (login_token: string): Promise<ApiResponse> => {
  try {
    const response = await axios.post("/auth/session", {
      temp_token: login_token,
    });
    return response?.data;
  } catch (error: any) {
    return error?.response?.data || { success: false, message: error.message };
  }
};
