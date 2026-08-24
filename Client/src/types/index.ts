export type UserRole = "User" | "Manager" | "Admin" | "SuperAdmin";
export type UserStatus = "Active" | "Blocked" | "Pending" | string;

export interface User {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  status?: UserStatus;
  avatar?: string;
  picture?: string;
  authProvider?: string;
  isEmailVerified?: boolean;
  storageUsed?: number;
  storageLimit?: number;
  maxStorageLimit?: number;
  usedStorageLimit?: number;
  availableStorageLimit?: number;
  storage?: { usedStorage?: number; totalStorage?: number };
  maxFileSize?: number;
  razorpayMode?: "live" | "test" | string;
  createdAt?: string;
  updatedAt?: string;
}

export interface DirectoryItem {
  _id: string;
  id?: string;
  name: string;
  type: "file" | "folder" | "directory";
  size?: number;
  mimeType?: string;
  extension?: string;
  parentId?: string | null;
  owner?: string | User;
  isPublic?: boolean;
  publicToken?: string;
  shareToken?: string;
  accessLevel?: "read" | "write" | "full" | string;
  createdAt?: string;
  updatedAt?: string;
  url?: string;
  sharedWith?: Array<{
    userId: string | User;
    permission: "view" | "edit" | string;
    _id?: string;
  }>;
}

export interface SharedUser {
  _id?: string;
  userId: User | string;
  permission: "view" | "edit" | "admin" | string;
  sharedAt?: string;
  user?: User;
}

export interface ShareDetails {
  _id: string;
  item: DirectoryItem;
  sharedBy: User;
  sharedWith: SharedUser[];
  publicAccess?: {
    enabled: boolean;
    permission: "view" | "edit";
  };
  shareLink?: string;
  createdAt?: string;
}

export interface SubscriptionPlan {
  _id?: string;
  id?: string;
  name: string;
  price: number;
  storageLimit: number;
  description?: string;
  features?: string[];
  billingCycle?: "monthly" | "yearly" | string;
  planId?: string;
}

export interface ActiveSubscription {
  _id?: string;
  planName?: string;
  status?: string;
  storageLimit?: number;
  expiresAt?: string;
  razorpaySubscriptionId?: string;
  startDate?: string;
  endDate?: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  total?: number;
  page?: number;
  limit?: number;
  [key: string]: any;
}

export interface StorageData {
  maxStorageLimit: number;
  usedStorageLimit: number;
  availableStorageLimit: number;
}
