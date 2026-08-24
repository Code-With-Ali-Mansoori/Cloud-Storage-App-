import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getAllUsers } from "../Apis/userApi";
import {
  changeRole,
  hardDelete,
  logout,
  recover,
  softDelete,
} from "../Apis/adminApi";
import { useModal } from "../Contexts/ModalContext";
import { User, UserRole } from "../types";

export interface AdminUserItem extends User {
  id?: string;
  isLoggedIn?: boolean;
  isDeleted?: boolean;
}

export const useUsers = () => {
  const [users, setUsers] = useState<AdminUserItem[]>([]);
  const [role, setRole] = useState<UserRole | string>("User");
  const [currentUser, setCurrentUser] = useState<AdminUserItem | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { showModal, showConfirmModal, closeConfirmModal } = useModal();

  const fetchUsers = async () => {
    setLoading(true);
    const res = await getAllUsers();
    if (res.success && res.data) {
      setUsers(res.data.Users || []);
      setRole(res.data.currentUser?.role || "User");
      setCurrentUser(res.data.currentUser || null);
      setError(null);
    } else {
      setError(res.message || "Failed to fetch users");
      setUsers([]);
      showModal("Error", res.message || "Failed to fetch users", "error");
      setTimeout(() => navigate("/"), 2000);
    }
    setLoading(false);
  };

  const handleLogout = async (userId: string) => {
    const user = users.find((u) => (u.id || u._id) === userId);
    const userName = user ? user.name || user.email : "this user";

    showConfirmModal(
      "Confirm Logout",
      `Are you sure you want to logout ${userName}? This will end their current session.`,
      async () => {
        const res = await logout(userId);
        if (res.success) {
          setUsers((prevUsers) =>
            prevUsers.map((user) =>
              (user.id || user._id) === userId ? { ...user, isLoggedIn: false } : user
            )
          );
          showModal("Success", "User logged out successfully", "success");
        } else {
          showModal("Error", res.message || "Failed to logout user", "error");
          console.error("Error logging out user:", res.message);
        }
        closeConfirmModal();
      },
      "warning"
    );
  };

  const handleSoftDelete = async (userId: string) => {
    const user = users.find((u) => (u.id || u._id) === userId);
    const userName = user ? user.name || user.email : "this user";

    showConfirmModal(
      "Confirm Soft Delete",
      `Are you sure you want to soft delete ${userName}? This will deactivate their account but data can be recovered.`,
      async () => {
        const res = await softDelete(userId);
        if (res.success) {
          setUsers((prevUsers) =>
            prevUsers.map((user) =>
              (user.id || user._id) === userId ? { ...user, isDeleted: true } : user
            )
          );
          showModal("Success", "User soft deleted successfully", "success");
        } else {
          showModal(
            "Error",
            res.message || "Failed to soft delete user",
            "error"
          );
          console.error("Error soft deleting user:", res.message);
        }
        closeConfirmModal();
      },
      "warning"
    );
  };

  const handleHardDelete = async (userId: string) => {
    const user = users.find((u) => (u.id || u._id) === userId);
    const userName = user ? user.name || user.email : "this user";

    showConfirmModal(
      "Confirm Hard Delete",
      `Are you sure you want to permanently delete ${userName}? This action cannot be undone and will remove all user data.`,
      async () => {
        const res = await hardDelete(userId);
        if (res.success) {
          setUsers((prevUsers) =>
            prevUsers.filter((user) => (user.id || user._id) !== userId)
          );
          showModal(
            "Success",
            "User permanently deleted successfully",
            "success"
          );
        } else {
          showModal(
            "Error",
            res.message || "Failed to hard delete user",
            "error"
          );
          console.error("Error hard deleting user:", res.message);
        }
        closeConfirmModal();
      },
      "danger"
    );
  };

  const handleRecover = async (userId: string) => {
    const user = users.find((u) => (u.id || u._id) === userId);
    const userName = user ? user.name || user.email : "this user";

    showConfirmModal(
      "Confirm Recovery",
      `Are you sure you want to recover ${userName}? This will reactivate their account and restore access.`,
      async () => {
        const res = await recover(userId);
        if (res.success) {
          setUsers((prevUsers) =>
            prevUsers.map((user) =>
              (user.id || user._id) === userId ? { ...user, isDeleted: false } : user
            )
          );
          showModal("Success", "User recovered successfully", "success");
        } else {
          showModal("Error", res.message || "Failed to recover user", "error");
          console.error("Error recovering user:", res.message);
        }
        closeConfirmModal();
      },
      "info"
    );
  };

  const handleChangeRole = async (userId: string, role: string) => {
    const user = users.find((u) => (u.id || u._id) === userId);
    const userName = user ? user.name || user.email : "this user";

    showConfirmModal(
      "Confirm Change Role",
      `Are you sure you want to change the role of ${userName} to ${role} ?`,
      async () => {
        const res = await changeRole(userId, role);
        if (res.success) {
          setUsers((prevUsers) =>
            prevUsers.map((user) =>
              (user.id || user._id) === userId ? { ...user, role: role as UserRole } : user
            )
          );
          showModal("Success", "User role changed successfully", "success");
        } else {
          showModal(
            "Error",
            res.message || "Failed to change user role",
            "error"
          );
          console.error("Error recovering user:", res.message);
        }
        closeConfirmModal();
      },
      "info"
    );
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  return {
    users,
    role,
    currentUser,
    loading,
    error,
    fetchUsers,
    handleLogout,
    handleSoftDelete,
    handleHardDelete,
    handleRecover,
    handleChangeRole,
  };
};
