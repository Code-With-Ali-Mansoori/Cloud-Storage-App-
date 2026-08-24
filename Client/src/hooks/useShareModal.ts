import { useEffect, useState } from "react";
import {
  changePermissionApi,
  generateShareLinkApi,
  getSharedUserAccessList,
  shareWithEmail,
  toggleLink,
} from "../Apis/shareApi";
import { DirectoryItem, User } from "../types";

export interface SelectedUser extends User {
  permission: string;
}

export const useShareModal = (currentFile: DirectoryItem | null) => {
  const [activeTab, setActiveTab] = useState<"link" | "email" | string>("link");
  const [showUserDropdown, setShowUserDropdown] = useState<boolean>(false);

  const [isLinkEnabled, setIsLinkEnabled] = useState<boolean>(false);
  const [shareLink, setShareLink] = useState<string>("");
  const [linkPermission, setLinkPermission] = useState<string>("viewer");
  const [isGeneratingLink, setIsGeneratingLink] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [sharedUsers, setSharedUsers] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<SelectedUser[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState<boolean>(true);

  useEffect(() => {
    if (currentFile?._id) {
      initializeModalData();
    }
  }, [currentFile?._id]);

  const initializeModalData = async () => {
    if (!currentFile?._id) return;
    setIsLoadingUsers(true);
    try {
      await loadSharedUsers();
      await generateShareLink("viewer");
    } catch (err) {
      console.error("Init failed:", err);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const loadSharedUsers = async () => {
    if (!currentFile?._id) return;
    try {
      const res = await getSharedUserAccessList(currentFile._id);
      if (res.success && res.data) {
        setAvailableUsers(res.data.availableUsers || []);
        setSharedUsers(res.data.sharedUsers || []);
      }
    } catch (err) {
      console.error("Load shared users failed:", err);
    }
  };

  const generateShareLink = async (permission: string) => {
    if (!currentFile?._id) return;
    setIsGeneratingLink(true);
    try {
      const res = await generateShareLinkApi(currentFile._id, permission);
      if (res.success && res.data) {
        setShareLink(res.data.link);
        setLinkPermission(res.data.permission);
        setIsLinkEnabled(res.data.enabled);
      }
    } catch (err) {
      console.error("Generate link failed:", err);
      setShareLink("");
    } finally {
      setIsGeneratingLink(false);
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Copy link failed:", err);
    }
  };

  const handleToggleLink = async () => {
    if (!currentFile?._id) return;
    const newState = !isLinkEnabled;
    setIsLinkEnabled(newState);

    try {
      const res = await toggleLink(currentFile._id, newState);
      if (res.success && res.data) {
        setLinkPermission(res.data.permission);
      }
    } catch (err) {
      console.error("Toggle failed:", err);
      setIsLinkEnabled(!newState);
    }
  };

  const handleChangeLinkPermission = async (newPermission: string) => {
    if (!currentFile?._id || linkPermission === newPermission) return;

    try {
      const res = await changePermissionApi(currentFile._id, newPermission);
      if (res.success && res.data) {
        setLinkPermission(res.data.permission);
      }
    } catch (err) {
      console.error("Change permission failed:", err);
    }
  };

  const handleSelectUser = (user: User) => {
    if (!selectedUsers.find((u) => u._id === user._id)) {
      setSelectedUsers((prev) => [...prev, { ...user, permission: "viewer" }]);
    }
    setShowUserDropdown(false);
  };

  const removeSelectedUser = (userId: string) => {
    setSelectedUsers((prev) => prev.filter((u) => u._id !== userId));
  };

  const updateUserPermission = (userId: string, newPermission: string) => {
    setSelectedUsers((prev) =>
      prev.map((u) => (u._id === userId ? { ...u, permission: newPermission } : u))
    );
  };

  const handleSendInvites = async () => {
    if (!currentFile?._id) return;
    const res = await shareWithEmail(currentFile._id, selectedUsers);
    if (res.success && res.data) {
      if (res.data.response?.length === 0) {
        setSelectedUsers([]);
        loadSharedUsers();
      } else {
        console.log(res.data.response);
      }
    }
  };

  const getFilteredAvailableUsers = () => {
    return availableUsers.filter(
      (u) =>
        !selectedUsers.find((s) => s._id === u._id) &&
        !sharedUsers.find((s) => s._id === u._id)
    );
  };

  return {
    activeTab,
    setActiveTab,
    showUserDropdown,
    setShowUserDropdown,
    isLinkEnabled,
    setIsLinkEnabled,
    shareLink,
    linkPermission,
    isGeneratingLink,
    copied,
    availableUsers,
    sharedUsers,
    selectedUsers,
    isLoadingUsers,
    handleCopyLink,
    handleToggleLink,
    handleChangeLinkPermission,
    handleSelectUser,
    removeSelectedUser,
    updateUserPermission,
    handleSendInvites,
    getFilteredAvailableUsers,
  };
};
