import { useState } from "react";
import { useLocation, useNavigate, type Location } from "react-router-dom";
import CourseLayout from "@/components/CourseLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { setAdminToken } from "@/lib/adminAuth";
import { authApi } from "@/services/authApi";
import { toast } from "sonner";

const AdminLogin = () => {
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: Location })?.from?.pathname || "/admin";

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      const { token } = await authApi.login(password.trim());
      setAdminToken(token);
      toast.success("Acesso liberado.");
      navigate(from, { replace: true });
    } catch (error: unknown) {
      console.error("[admin-login] error", error);
      toast.error("Senha inválida.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <CourseLayout minimalHeader>
      <div className="container mx-auto px-4 py-24">
        <div className="max-w-md mx-auto">
          <Card className="bg-card shadow-card border border-border/60">
            <CardHeader>
              <CardTitle className="text-2xl font-display text-foreground text-center">
                Acesso ao painel
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="admin-password">Senha</Label>
                  <Input
                    id="admin-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Digite a senha do painel"
                    required
                  />
                </div>
                <Button type="submit" variant="hero" className="w-full" disabled={submitting}>
                  {submitting ? "Validando..." : "Entrar"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </CourseLayout>
  );
};

export default AdminLogin;
