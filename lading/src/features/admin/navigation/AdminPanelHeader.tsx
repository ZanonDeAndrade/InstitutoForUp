import { Link } from "react-router-dom";
import AdminLogoutButton from "@/components/AdminLogoutButton";
import { Button } from "@/components/ui/button";

export const AdminPanelHeader = ({ canPublishNews }: { canPublishNews: boolean }) => (
  <div className="text-center mb-10">
    <h1 className="text-4xl md:text-5xl font-display font-bold mb-4 text-gradient-gold">Painel do Administrador</h1>
    <p className="text-muted-foreground text-lg">
      Acompanhe os interesses registrados em cada curso e gerencie os programas disponíveis.
    </p>
    <div className="mt-4 flex justify-center">
      <div className="flex gap-3">
        {canPublishNews && (
          <Button asChild variant="secondary">
            <Link to="/news">Gerenciar blog</Link>
          </Button>
        )}
        <AdminLogoutButton />
      </div>
    </div>
  </div>
);
