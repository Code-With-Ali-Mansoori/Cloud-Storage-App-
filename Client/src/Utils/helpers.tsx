import {
  Edit3,
  Eye,
  File,
  FileArchive,
  FileCode,
  FileJson,
  FileQuestion,
  FileSpreadsheet,
  FileSymlink,
  FileText,
  FileType,
  Folder,
  ImageIcon,
  ImageUp,
  Music,
  Presentation,
  Video
} from "lucide-react";
import React, { useState } from "react";
import { regenerateSession } from "../Apis/authApi";
import { User, DirectoryItem } from "../types";

export interface UserAvatarProps {
  user: {
    name?: string;
    picture?: string;
    avatar?: string;
    [key: string]: any;
  };
  size?: string;
}

export const UserAvatar: React.FC<UserAvatarProps> = ({ user, size = "w-8 h-8" }) => {
  const [imageError, setImageError] = useState(false);

  const getInitials = (name = "") => {
    return name
      .split(" ")
      ?.map((part) => part[0]?.toUpperCase())
      .slice(0, 2)
      .join("");
  };

  const imageSrc = user.picture || user.avatar;

  return (
    <div
      className={`${size} rounded-full overflow-hidden flex items-center justify-center bg-gray-300 text-sm font-medium text-white`}
    >
      {!imageError && imageSrc ? (
        <img
          src={imageSrc}
          alt={user.name || "User"}
          className="w-full h-full object-cover"
          onError={() => setImageError(true)}
        />
      ) : (
        <span>{getInitials(user.name || "")}</span>
      )}
    </div>
  );
};

export const PermissionBadge: React.FC<{ permission: string }> = ({ permission }) => (
  <div
    className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${
      permission === "editor"
        ? "bg-orange-100 text-orange-700 border border-orange-200"
        : "bg-blue-100 text-blue-700 border border-blue-200"
    }`}
  >
    {permission === "editor" ? <Edit3 size={10} /> : <Eye size={10} />}
    <span className="capitalize">{permission}</span>
  </div>
);

export const formatDate = (dateString: string | number | Date): string => {
  return new Date(dateString).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

export const formatTime = (timeString: string | number | Date): string => {
  const date = new Date(timeString);
  const now = new Date();

  const diffInMs = now.getTime() - date.getTime();
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMinutes / 60);
  const diffInDays = Math.floor(diffInHours / 24);
  const diffInMonths = Math.floor(diffInDays / 30);
  const diffInYears = Math.floor(diffInDays / 365);

  if (diffInMs < 60 * 1000) return "Just now";
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  if (diffInHours < 24) return `${diffInHours}h ago`;
  if (diffInDays < 7) return `${diffInDays}d ago`;
  if (diffInDays < 30) return `${diffInDays}d ago`;
  if (diffInDays < 365) return `${diffInMonths}mo ago`;
  return `${diffInYears}y ago`;
};

const getFileExtension = (name: string): string => name.split(".").pop()?.toLowerCase() || "";

export const renderFilePreview = (file: { name: string }, fileUrl: string) => {
  const ext = getFileExtension(file.name);

  switch (ext) {
    case "jpg":
    case "jpeg":
    case "png":
    case "gif":
    case "webp":
      return (
        <div className="flex items-center justify-center min-h-96 bg-gray-50 rounded-lg">
          <img
            src={fileUrl}
            alt={file.name}
            className="max-w-full max-h-96 object-contain rounded-lg"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = "none";
              if (target.nextSibling) {
                (target.nextSibling as HTMLElement).style.display = "block";
              }
            }}
          />
          <div className="hidden text-center">
            <ImageUp className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Failed to load image</p>
          </div>
        </div>
      );

    case "pdf":
    case "txt":
      return (
        <iframe
          src={fileUrl}
          className="w-full h-[80vh] rounded"
          title={file.name}
        />
      );

    case "mp4":
    case "webm":
    case "ogg":
      return (
        <div className="flex justify-center bg-gray-50 rounded-lg p-4">
          <video
            controls
            className="max-w-full max-h-96 rounded-lg"
            src={fileUrl}
          />
        </div>
      );

    case "mp3":
    case "wav":
      return (
        <div className="bg-gray-50 rounded-lg p-6 text-center">
          <Music className="w-10 h-10 text-purple-500 mx-auto mb-4" />
          <audio controls className="w-full max-w-md mx-auto" src={fileUrl} />
        </div>
      );

    default:
      return (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <File className="w-10 h-10 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Preview not available</p>
          <a
            href={fileUrl}
            download={file.name}
            className="inline-block bg-blue-500 mt-3 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-2xl transition duration-200"
          >
            Download {file.name}
          </a>
        </div>
      );
  }
};

export interface SessionLimitModalOptions {
  showModal: (title: string, message: string, type?: string) => void;
  showConfirmModal: (
    title: string,
    message: string,
    onConfirm: () => void | Promise<void>,
    type?: string
  ) => void;
  closeConfirmModal: () => void;
  checkAuthentication: () => Promise<void>;
  token: string;
}

export const showSessionLimitExceedModal = ({
  showModal,
  showConfirmModal,
  closeConfirmModal,
  checkAuthentication,
  token,
}: SessionLimitModalOptions) => {
  showConfirmModal(
    "Session Limit Exceeded",
    "Looks like you’re already signed in on the allowed number of devices for your plan. Would you like to sign out from older sessions and continue here?",
    async () => {
      const res = await regenerateSession(token);
      if (res.success) {
        await checkAuthentication();
        window.location.href = "/";
      } else {
        showModal("Error", res.message || "Something went wrong.", "error");
      }
      closeConfirmModal();
    },
    "warning"
  );
};

export const formatFileSize = (bytes?: number): string => {
  if (!bytes) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

export const getFileIcon = (item: { name: string; type?: string }, viewMode: "list" | "grid" = "list") => {
  if (item.type === "directory" || item.type === "folder") {
    return (
      <Folder
        className={`${
          viewMode === "grid" ? "w-8 h-8" : "w-5 h-5"
        } text-blue-500`}
      />
    );
  }

  const extension = item.name.split(".").pop()?.toLowerCase() || "";
  const iconSize = viewMode === "grid" ? "w-8 h-8" : "w-5 h-5";

  if (["ppt", "pptx"].includes(extension)) {
    return <Presentation className={`${iconSize} text-orange-600`} />;
  }

  // Images
  if (["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(extension)) {
    return <ImageIcon className={`${iconSize} text-green-500`} />;
  }

  // Videos
  if (["mp4", "avi", "mov", "wmv", "flv", "mkv", "webm"].includes(extension)) {
    return <Video className={`${iconSize} text-purple-500`} />;
  }

  // Audio
  if (["mp3", "wav", "flac", "aac", "ogg"].includes(extension)) {
    return <Music className={`${iconSize} text-pink-500`} />;
  }

  // Documents
  if (["txt", "md"].includes(extension)) {
    return <FileText className={`${iconSize} text-orange-500`} />;
  }
  if (["pdf"].includes(extension)) {
    return <FileType className={`${iconSize} text-red-500`} />;
  }
  if (["doc", "docx"].includes(extension)) {
    return <FileText className={`${iconSize} text-blue-600`} />;
  }
  if (["xls", "xlsx", "csv"].includes(extension)) {
    return <FileSpreadsheet className={`${iconSize} text-green-600`} />;
  }

  // Archives
  if (["zip", "rar", "7z", "tar", "gz"].includes(extension)) {
    return <FileArchive className={`${iconSize} text-yellow-600`} />;
  }

  // Code files
  if (
    [
      "js",
      "jsx",
      "ts",
      "tsx",
      "py",
      "java",
      "c",
      "cpp",
      "html",
      "css",
    ].includes(extension)
  ) {
    return <FileCode className={`${iconSize} text-cyan-500`} />;
  }
  if (["json"].includes(extension)) {
    return <FileJson className={`${iconSize} text-emerald-500`} />;
  }

  // Symlinks
  if (["lnk", "shortcut"].includes(extension)) {
    return <FileSymlink className={`${iconSize} text-gray-500`} />;
  }

  // Fallback
  return <FileQuestion className={`${iconSize} text-gray-400`} />;
};

const extensionToMime = {
  md: "text/markdown",
  csv: "text/csv",
  txt: "text/plain",
  json: "application/json",
};

export function getMimeType(file: { name: string; type?: string }): string {
  if (file.type) return file.type;
  const ext = file.name.split(".").pop()?.toLowerCase() || "";
  return extensionToMime[ext as keyof typeof extensionToMime] || "application/octet-stream";
}
