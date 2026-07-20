import { ReactNode, useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { clearLegacyAdminStorage } from "@/lib/adminAuth";
import { authApi } from "@/services/authApi";
import type { AdminSessionUser } from "@/lib/adminPermissions";
import { AdminSessionContext } from "@/lib/adminSessionContext";

interface RequireAdminProps {
  children: ReactNode;
}

const RequireAdmin = ({ children }: RequireAdminProps) => {
  const location = useLocation();
  const [status, setStatus] = useState<"checking" | "authenticated" | "unauthenticated">("checking");
  const [user, setUser] = useState<AdminSessionUser | null>(null);

  useEffect(() => {
    let active = true;
    clearLegacyAdminStorage();
    authApi
      .session()
      .then((session) => {
        if (active) {
          setUser(session.user);
          setStatus("authenticated");
        }
      })
      .catch(() => {
        if (active) {
          setUser(null);
          setStatus("unauthenticated");
        }
      });

    return () => {
      active = false;
    };
  }, []);

  if (status === "checking") {
    return null;
  }

  if (status === "unauthenticated") {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <AdminSessionContext.Provider value={user}>{children}</AdminSessionContext.Provider>;
};

export default RequireAdmin;
