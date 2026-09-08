import axios from "./axios";
import { ApiResponse } from "../types";

export const handleCreateSubscription = async (planId : string): Promise<ApiResponse> => {
  try {
    const response = await axios.post(`/subscription/create`, { planId });

    console.log(response.data);

    return { success: true, ...response.data };

  } catch (error: any) {
    console.log(error);
    return error?.response?.data || { success: false, message: error.message };

  }
};

export const checkSubscriptionStatus = async (): Promise<ApiResponse> => {
  try {
    const response = await axios.get(`/subscription/status`);
    return { success: true, ...response.data };
  } catch (error: any) {
    return error?.response?.data || { success: false, message: error.message };
  }
};

export const cancelSubscription = async (): Promise<ApiResponse> => {
  try {
    const response = await axios.delete(`/subscription/cancel`);
    return { success: true, ...response.data };
  } catch (error: any) {
    return error?.response?.data || { success: false, message: error.message };
  }
};

export const changePlan = async (planId: string): Promise<ApiResponse> => {
  try {
    const response = await axios.post(`/subscription/changePlan`, {
      changePlanId: planId,
    });
    return { success: true, ...response.data };
  } catch (error: any) {
    return error?.response?.data || { success: false, message: error.message };
  }
};

export const plansEligibleforChange = async (): Promise<ApiResponse> => {
  try {
    const response = await axios.get(`/subscription/change-eligibility`);
    return { success: true, ...response.data };
  } catch (error: any) {
    return error?.response?.data || { success: false, message: error.message };
  }
};

export const confirmSubscription = async (subscriptionId: string): Promise<ApiResponse> => {
  try {
    const response = await axios.post(`/subscription/confirm`, { subscriptionId });
    return { success: true, ...response.data };
  } catch (error: any) {
    return error?.response?.data || { success: false, message: error.message };
  }
};