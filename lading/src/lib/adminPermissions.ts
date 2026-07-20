export const ADMIN_PERMISSIONS = {
  VIEW_LEADS: "leads.view",
  DELETE_LEADS: "leads.delete",
  MANAGE_COURSES: "courses.manage",
  PUBLISH_NEWS: "news.publish",
  MANAGE_IMAGES: "images.manage",
  MANAGE_USERS: "users.manage",
} as const;

export type AdminPermission = (typeof ADMIN_PERMISSIONS)[keyof typeof ADMIN_PERMISSIONS];
export type AdminRole = "super_admin" | "editor" | "viewer";

export interface AdminSessionUser {
  id: string;
  email?: string;
  username: string;
  role: AdminRole;
  permissions: AdminPermission[];
}

export const hasAdminPermission = (user: AdminSessionUser | null | undefined, permission: AdminPermission) =>
  user?.permissions.includes(permission) ?? false;
