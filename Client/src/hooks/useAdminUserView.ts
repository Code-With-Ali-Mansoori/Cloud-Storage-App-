import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getUserDirectory } from "../Apis/adminApi";
import { useModal } from "../Contexts/ModalContext";
import { DirectoryItem, User } from "../types";

export interface PathItem {
  id: string;
  name: string;
}

const useAdminUserView = () => {
  const navigate = useNavigate();
  const { userId, dirId } = useParams<{ userId: string; dirId: string }>();
  const { showModal } = useModal();
  
  const [directories, setDirectories] = useState<DirectoryItem[]>([]);
  const [files, setFiles] = useState<DirectoryItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [currentPath, setCurrentPath] = useState<PathItem[]>([]);
  const [targetUser, setTargetUser] = useState<Partial<User>>({});
  const [previewFile, setPreviewFile] = useState<DirectoryItem | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchDirectory = async (targetDirId = dirId || "") => {
    if (!userId) return;
    setLoading(true);
    setError(null);
    
    try {
      const res = await getUserDirectory(userId, targetDirId);
      if (res.success) {
        setDirectories(res.data?.directories || []);
        setFiles(res.data?.files || []);
        setTargetUser(res.data?.targetUser || {});
      } else {
        const errorMessage = res.message || "Failed to fetch user directory";
        setError(errorMessage);
        showModal("Error", errorMessage, "error");
        navigate("/users");
      }
    } catch (error) {
      const errorMessage = "An error occurred while fetching directory";
      setError(errorMessage);
      showModal("Error", errorMessage, "error");
      navigate("/users");
    } finally {
      setLoading(false);
    }
  };

  const handleDirectoryClick = async (directory: DirectoryItem) => {
    setCurrentPath((prev) => [
      ...prev,
      { id: directory._id, name: directory.name },
    ]);
    navigate(`/users/${userId}/${directory._id}`);
    await fetchDirectory(directory._id);
  };

  const handleBreadcrumbClick = async (index: number) => {
    if (index === -1) {
      setCurrentPath([]);
      navigate(`/users/${userId}`);
      await fetchDirectory("");
    } else {
      const targetPath = currentPath[index];
      setCurrentPath((prev) => prev.slice(0, index + 1));
      navigate(`/users/${userId}/${targetPath.id}`);
      await fetchDirectory(targetPath.id);
    }
  };

  const closeFilePreview = () => {
    setPreviewFile(null);
  };

  const goBack = () => {
    navigate("/users");
  };

  const refreshDirectory = () => {
    fetchDirectory(dirId);
  };

  useEffect(() => {
    fetchDirectory();
  }, [dirId, userId]);

  const hasDirectories = directories.length > 0;
  const hasFiles = files.length > 0;
  const isEmpty = !hasDirectories && !hasFiles;

  return {
    directories,
    files,
    loading,
    error,
    currentPath,
    targetUser,
    previewFile,
    
    hasDirectories,
    hasFiles,
    isEmpty,
    
    handleDirectoryClick,
    handleBreadcrumbClick,
    closeFilePreview,
    goBack,
    refreshDirectory,
    
    userId,
    dirId,
    
    setPreviewFile,
    setCurrentPath,
  };
};

export default useAdminUserView;