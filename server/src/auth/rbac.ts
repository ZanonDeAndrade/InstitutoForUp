import type { AdminRoleValue } from "../services/adminAuthService";

export const ADMIN_PERMISSIONS = {
  VIEW_LEADS: "leads.view",
  DELETE_LEADS: "leads.delete",
  MANAGE_COURSES: "courses.manage",
  PUBLISH_NEWS: "news.publish",
  MANAGE_IMAGES: "images.manage",
  MANAGE_USERS: "users.manage",
} as const;

export type AdminPermission = (typeof ADMIN_PERMISSIONS)[keyof typeof ADMIN_PERMISSIONS];

const allPermissions = Object.values(ADMIN_PERMISSIONS);

const permissionsByRole: Record<AdminRoleValue, readonly AdminPermission[]> = {
  super_admin: allPermissions,
  editor: [
    ADMIN_PERMISSIONS.VIEW_LEADS,
    ADMIN_PERMISSIONS.MANAGE_COURSES,
    ADMIN_PERMISSIONS.PUBLISH_NEWS,
    ADMIN_PERMISSIONS.MANAGE_IMAGES,
  ],
  viewer: [ADMIN_PERMISSIONS.VIEW_LEADS],
};

export const permissionsForRole = (role: AdminRoleValue): AdminPermission[] => [...(permissionsByRole[role] ?? [])];

export const roleHasPermission = (role: AdminRoleValue, permission: AdminPermission) =>
  permissionsByRole[role]?.includes(permission) ?? false;
