import { User, UserRole } from "../types";

const roleHierarchy: Record<UserRole, number> = {
  User: 1,
  Manager: 2,
  Admin: 3,
  SuperAdmin: 4,
};

export const getUserPermissions = (currentUserRole: UserRole | string) => {
  const canViewDirectory = (user: { role: UserRole | string }) => {
    const currentUserLevel = roleHierarchy[currentUserRole as UserRole] || 0;
    const targetUserLevel = roleHierarchy[user.role as UserRole] || 0;

    if (currentUserLevel > targetUserLevel) return true;
    return false;
  };

  const isLogoutDisabled = (user: { isLoggedIn?: boolean; role: UserRole | string }) => {
    if (!user.isLoggedIn) return true;

    const currentUserLevel = roleHierarchy[currentUserRole as UserRole] || 0;
    const targetUserLevel = roleHierarchy[user.role as UserRole] || 0;

    if (currentUserLevel <= targetUserLevel) return true;
    if (
      currentUserRole !== "Admin" &&
      currentUserRole !== "Manager" &&
      currentUserRole !== "SuperAdmin"
    )
      return true;

    return false;
  };

  const getLogoutTooltip = (user: { isLoggedIn?: boolean; role: UserRole | string }) => {
    if (!user.isLoggedIn) return "User is already logged out";

    const currentUserLevel = roleHierarchy[currentUserRole as UserRole] || 0;
    const targetUserLevel = roleHierarchy[user.role as UserRole] || 0;

    if (currentUserLevel <= targetUserLevel) {
      return `${currentUserRole}s cannot logout ${user.role} users (equal or higher role)`;
    }

    if (
      currentUserRole !== "Admin" &&
      currentUserRole !== "Manager" &&
      currentUserRole !== "SuperAdmin"
    )
      return "Insufficient permissions to logout users";

    return "Logout user";
  };

  const canDelete = (user: { role: UserRole | string }) => {
    if (user.role === currentUserRole) return false;
    if (currentUserRole === "SuperAdmin" && user.role !== "SuperAdmin")
      return true;
    if (
      currentUserRole === "Admin" &&
      user.role !== "SuperAdmin" &&
      user.role !== "Admin"
    )
      return true;
    return false;
  };

  const canRecover = (user: { isDeleted?: boolean }) => {
    return currentUserRole === "SuperAdmin" && !!user.isDeleted;
  };

  const getDeleteTooltip = (user: { isDeleted?: boolean; role: UserRole | string }) => {
    if (user.isDeleted) return "User is already deleted";
    if (user.role === currentUserRole)
      return `${currentUserRole}s cannot delete other ${currentUserRole}s`;
    if (currentUserRole === "SuperAdmin" && user.role !== "SuperAdmin")
      return "Delete user";
    if (currentUserRole === "Admin") {
      if (user.role === "SuperAdmin")
        return "Admins cannot delete SuperAdmin users";
      if (user.role === "Admin") return "Admins cannot delete other Admins";
      return "Soft delete user";
    }
    return "Insufficient permissions to delete users";
  };

  return {
    canViewDirectory,
    isLogoutDisabled,
    getLogoutTooltip,
    canDelete,
    canRecover,
    getDeleteTooltip,
  };
};

export const getRoleChangePermissions = () => {
  const canChangeRole = (
    currentUser: { id?: string; _id?: string; role: UserRole | string },
    targetUser: { id?: string; _id?: string; role: UserRole | string }
  ) => {
    const currentId = currentUser.id || currentUser._id;
    const targetId = targetUser.id || targetUser._id;
    if (currentId === targetId) {
      return false;
    }

    const currentUserRoleLevel = roleHierarchy[currentUser.role as UserRole] || 1;
    const targetUserRoleLevel = roleHierarchy[targetUser.role as UserRole] || 1;

    if (currentUserRoleLevel < targetUserRoleLevel) {
      return false;
    }

    if (currentUserRoleLevel === targetUserRoleLevel) {
      return false;
    }

    return true;
  };

  const getAvailableRoles = (
    currentUser: { role: UserRole | string },
    targetUser: { role: UserRole | string }
  ) => {
    const allRoles: UserRole[] = ["User", "Manager", "Admin", "SuperAdmin"];
    const currentUserRoleLevel = roleHierarchy[currentUser.role as UserRole] || 1;

    return allRoles.filter((role) => {
      const roleLevel = roleHierarchy[role];

      if (role === "SuperAdmin" && currentUser.role !== "SuperAdmin") {
        return false;
      }

      return roleLevel <= currentUserRoleLevel && role !== targetUser.role;
    });
  };

  const getRoleChangeTooltip = (
    currentUser: { id?: string; _id?: string; role: UserRole | string },
    targetUser: { id?: string; _id?: string; role: UserRole | string }
  ) => {
    const currentId = currentUser.id || currentUser._id;
    const targetId = targetUser.id || targetUser._id;
    if (currentId === targetId) {
      return "You cannot change your own role";
    }

    const currentUserRoleLevel = roleHierarchy[currentUser.role as UserRole] || 1;
    const targetUserRoleLevel = roleHierarchy[targetUser.role as UserRole] || 1;

    if (currentUserRoleLevel < targetUserRoleLevel) {
      return `${currentUser.role}s cannot change roles of ${targetUser.role}s (higher role)`;
    }

    if (currentUserRoleLevel === targetUserRoleLevel) {
      return `${currentUser.role}s cannot change roles of other ${targetUser.role}s (same role)`;
    }

    return "Change user role";
  };

  return {
    canChangeRole,
    getAvailableRoles,
    getRoleChangeTooltip,
  };
};
