import { createContext, useContext } from "react";
import type { AdminSessionUser } from "@/lib/adminPermissions";

export const AdminSessionContext = createContext<AdminSessionUser | null>(null);

export const useAdminSession = () => useContext(AdminSessionContext);
