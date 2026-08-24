import React, { useState } from "react";
import { UserSettings } from "../Apis/userApi";
import { StorageData } from "../types";

export interface ProfileData {
  name: string;
  email: string;
  picture: string;
}

export interface PasswordData {
  current: string;
  new: string;
  confirm: string;
}

export interface UseUserSettingsOptions {
  showModal: (title: string, message: string, type?: string) => void;
  setStorageData: React.Dispatch<React.SetStateAction<StorageData>>;
}

export default function useUserSettings({ showModal, setStorageData }: UseUserSettingsOptions) {
  const [profileData, setProfileData] = useState<ProfileData>({
    name: "",
    email: "",
    picture: "",
  });
  const [originalProfileData, setOriginalProfileData] = useState<ProfileData>({
    name: "",
    email: "",
    picture: "",
  });
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);

  const [passwordData, setPasswordData] = useState<PasswordData>({
    current: "",
    new: "",
    confirm: "",
  });

  const [hasManualPassword, setHasManualPassword] = useState<boolean>(false);
  const [isSocialLogin, setSocialLogin] = useState<boolean>(false);
  const [connectedAccount, setConnectedAccount] = useState<Record<string, any>>({});

  const hasProfileChanges = (): boolean => {
    return (
      profileData.name !== originalProfileData.name || selectedImage !== null
    );
  };

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      showModal("Invalid File", "Only image files are allowed.", "error");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      showModal("File Too Large", "Image must be < 2MB", "error");
      return;
    }

    setSelectedImage(file);

    const reader = new FileReader();
    reader.onload = (e) => setImagePreview(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  const getUserSettings = async () => {
    const res = await UserSettings();
    if (res.success && res.data) {
      const {
        name,
        email,
        picture,
        manualLogin,
        socialLogin,
        socialProvider,
        maxStorageLimit,
        usedStorageLimit,
        availableStorageLimit,
      } = res.data;
      const userData = { email, name, picture };
      const storageData = {
        maxStorageLimit,
        usedStorageLimit,
        availableStorageLimit
      };
      setProfileData(userData);
      setOriginalProfileData(userData);
      setHasManualPassword(manualLogin);
      setStorageData(storageData);
      if (socialLogin) {
        setSocialLogin(true);
        setConnectedAccount({ provider: socialProvider, email });
      }
    } else {
      showModal("Error", "Failed to load user settings.", "error");
    }
  };

  return {
    profileData,
    setProfileData,
    originalProfileData,
    setOriginalProfileData,
    imagePreview,
    selectedImage,
    setImagePreview,
    setSelectedImage,
    passwordData,
    setPasswordData,
    hasManualPassword,
    setHasManualPassword,
    isSocialLogin,
    setSocialLogin,
    connectedAccount,
    setConnectedAccount,
    handleImageSelect,
    hasProfileChanges,
    getUserSettings,
  };
}
