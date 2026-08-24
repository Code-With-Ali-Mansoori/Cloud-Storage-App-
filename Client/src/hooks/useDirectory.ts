import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getItemList } from "../Apis/file_Dir_Api";
import { DirectoryItem } from "../types";

export interface BreadCrumbItem {
  id: string;
  name: string;
  _id?: string;
}

const useDirectory = () => {
  const [files, setFiles] = useState<DirectoryItem[]>([]);
  const [directories, setDirectories] = useState<DirectoryItem[]>([]);
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [showShareModal, setShowShareModal] = useState<boolean>(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [breadCrumb, setBreadCrumb] = useState<BreadCrumbItem[]>([]);
  const [actionDone, setActionDone] = useState<boolean>(false);
  const [currentFile, setCurrentFile] = useState<DirectoryItem | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const { dirId } = useParams<{ dirId: string }>();

  const fetchDirectoryItems = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await getItemList(dirId);
      if (res.success && res.data) {
        const { files, directory, breadCrumb } = res.data;
        setBreadCrumb(breadCrumb || []);
        setFiles(files || []);
        setDirectories(directory || []);
      } else {
        console.log(res.message);
      }
    } catch (err: any) {
      setError(
        err.message || "An error occurred while fetching directory items"
      );
      console.error("Error fetching directory items:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDirectoryItems();
    setActionDone(false);
  }, [actionDone, dirId]);

  const allItems = [...directories, ...files].sort((a, b) => {
    if (a.type === "directory" && b.type === "file") return -1;
    if (a.type === "file" && b.type === "directory") return 1;
    return a.name.localeCompare(b.name);
  });

  const handleCreateModalOpen = () => setShowCreateModal(true);
  const handleCreateModalClose = () => setShowCreateModal(false);
  const handleCreateSuccess = () => {
    setShowCreateModal(false);
    setActionDone(true);
  };

  const handleShareModalOpen = (file: DirectoryItem) => {
    setCurrentFile(file);
    setShowShareModal(true);
  };
  const handleShareModalClose = () => {
    setShowShareModal(false);
    setCurrentFile(null);
  };

  const handleDropdownClose = () => setActiveDropdown(null);
  const handleDropdownToggle = (itemId: string) => {
    setActiveDropdown(activeDropdown === itemId ? null : itemId);
  };

  const handleActionComplete = () => setActionDone(true);
  const refreshDirectory = () => setActionDone(true);

  return {
    files,
    directories,
    allItems,
    loading,
    error,
    breadCrumb,

    showCreateModal,
    showShareModal,
    currentFile,

    activeDropdown,

    handleCreateModalOpen,
    handleCreateModalClose,
    handleCreateSuccess,
    handleShareModalOpen,
    handleShareModalClose,

    handleDropdownClose,
    handleDropdownToggle,

    handleActionComplete,
    refreshDirectory,

    setActiveDropdown,
    setActionDone,
    setShowShareModal,
    setCurrentFile,
    setShowCreateModal,

    dirId,
  };
};

export default useDirectory;
