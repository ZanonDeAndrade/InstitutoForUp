import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { clearLegacyAdminStorage } from "@/lib/adminAuth";
import { authApi } from "@/services/authApi";
import { toast } from "sonner";

const AdminLogoutButton = () => {
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    setSubmitting(true);
    try {
      await authApi.logout();
      clearLegacyAdminStorage();
      navigate("/login", { replace: true });
    } catch (error) {
      console.error("[admin-logout] error", error);
      toast.error("Nao foi possivel encerrar a sessao.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Button type="button" variant="outline" size="sm" onClick={handleLogout} disabled={submitting}>
      {submitting ? "Saindo..." : "Sair"}
    </Button>
  );
};

export default AdminLogoutButton;
