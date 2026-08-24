import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  changePermissionOfUserApi,
  generateShareLinkApi,
  getFilePermissionInfo,
  revokeAccess,
  toggleLink,
} from "../Apis/shareApi";
import { useModal } from "../Contexts/ModalContext";
import { DirectoryItem, SharedUser } from "../types";

export interface LinkSharingState {
  link: string;
  enabled: boolean;
  permission: string;
}

export const usePermissionManager = () => {
  const navigate = useNavigate();
  const { fileId } = useParams<{ fileId: string }>();
  const { showModal, showConfirmModal, closeConfirmModal } = useModal();

  const [file, setFile] = useState<DirectoryItem | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [pageLoading, setPageLoading] = useState<boolean>(true);
  const [copySuccess, setCopySuccess] = useState<boolean>(false);
  const [linkSharing, setLinkSharing] = useState<LinkSharingState>({
    link: ``,
    enabled: false,
    permission: "viewer",
  });
  const [sharedUsers, setSharedUsers] = useState<any[]>([]);

  const fetchFilePermissionInfo = async () => {
    if (!fileId) return;
    setPageLoading(true);
    try {
      const response = await getFilePermissionInfo(fileId);
      if (response.success && response.data) {
        const fileInfo = response.data.fileInfo;
        setFile(fileInfo);

        if (fileInfo?.sharedViaLink?.enabled) {
          setLinkSharing({
            link: `${window.location.origin}/guest/access/${
              fileInfo._id
            }?token=${fileInfo.sharedViaLink.token}`,
            enabled: fileInfo.sharedViaLink.enabled,
            permission: fileInfo.sharedViaLink.permission,
          });
        }

        setSharedUsers(fileInfo?.sharedWith || []);
      } else {
        console.log(response.message);
      }
    } catch (error) {
      console.error("Failed to fetch file info:", error);
    } finally {
      setPageLoading(false);
    }
  };

  const handleUpdatePermission = async (userId: string, newPermission: string) => {
    if (!fileId) return;
    setLoading(true);
    try {
      const selectedUser = sharedUsers.find(
        (u) => (u.userId?._id || u.userId) === userId
      )?.userId;

      showConfirmModal(
        "Change User Permission",
        `Are you sure you want to change ${selectedUser?.name || "user"}'s permission to "${newPermission}"? This will immediately update their access level.`,
        async () => {
          const res = await changePermissionOfUserApi(
            fileId,
            userId,
            newPermission
          );
          if (res.success) {
            setSharedUsers((users) =>
              users.map((share) =>
                (share.userId?._id || share.userId) === userId
                  ? { ...share, permission: newPermission }
                  : share
              )
            );
          } else {
            showModal("Error", res.message || "Something went wrong.", "error");
          }
          closeConfirmModal();
        },
        "warning"
      );
    } catch (error) {
      console.error("Failed to update permission:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRevokeAccess = async (userId: string) => {
    if (!fileId) return;
    setLoading(true);
    try {
      const selectedUser = sharedUsers.find(
        (u) => (u.userId?._id || u.userId) === userId
      )?.userId;

      showConfirmModal(
        "Revoke Access",
        `Are you sure you want to revoke ${selectedUser?.name || "user"}'s access? They will no longer be able to view or interact with this file.`,
        async () => {
          const res = await revokeAccess(fileId, userId);
          if (res.success) {
            setSharedUsers((users) =>
              users.filter((share) => (share.userId?._id || share.userId) !== userId)
            );
          } else {
            showModal("Error", res.message || "Something went wrong.", "error");
          }
          closeConfirmModal();
        },
        "warning"
      );
    } catch (error) {
      console.error("Failed to revoke access:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = async () => {
    if (linkSharing.link) {
      try {
        await navigator.clipboard.writeText(linkSharing.link);
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
      } catch (error) {
        console.error("Failed to copy link:", error);
      }
    }
  };

  const handleToggleLink = async () => {
    if (!file) return;
    const newState = !linkSharing.enabled;
    try {
      let res;
      if (linkSharing.permission) {
        res = await toggleLink(file._id, newState);
        if (res.success) {
          setLinkSharing((prev) => ({
            ...prev,
            link: `${window.location.origin}/guest/access/${
              file._id
            }?token=${(file as any).sharedViaLink?.token}`,
            enabled: newState,
          }));
        }
      } else {
        res = await generateShareLinkApi(file._id, "viewer");
        if (res.success && res.data) {
          setLinkSharing({
            link: res.data.link,
            permission: res.data.permission,
            enabled: res.data.enabled,
          });
        }
      }
    } catch (error) {
      console.error("Failed to toggle link:", error);
    }
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  useEffect(() => {
    fetchFilePermissionInfo();
  }, [fileId]);

  return {
    file,
    loading,
    pageLoading,
    copySuccess,
    linkSharing,
    sharedUsers,
    fileId,

    fetchFilePermissionInfo,
    handleUpdatePermission,
    handleRevokeAccess,
    handleCopyLink,
    handleToggleLink,
    handleGoBack,

    setFile,
    setLoading,
    setPageLoading,
    setCopySuccess,
    setLinkSharing,
    setSharedUsers,
  };
};
