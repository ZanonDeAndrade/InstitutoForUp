import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import CourseLayout from "@/components/CourseLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import NewsForm from "@/components/NewsForm";
import { UpsertNewsDto } from "@/types/news";
import { adminNewsApi } from "@/services/adminNewsApi";
import { toast } from "sonner";
import { useAdminSession } from "@/lib/adminSessionContext";
import { ADMIN_PERMISSIONS, hasAdminPermission } from "@/lib/adminPermissions";

const NewsCreate = () => {
  const navigate = useNavigate();
  const adminUser = useAdminSession();
  const canPublishNews = hasAdminPermission(adminUser, ADMIN_PERMISSIONS.PUBLISH_NEWS);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (payload: UpsertNewsDto) => {
    if (!canPublishNews) {
      toast.error("Acesso negado.");
      return;
    }

    try {
      setSubmitting(true);
      const created = await adminNewsApi.create(payload);
      toast.success("Post criado com sucesso.");
      navigate(`/news/${created.slug}/edit`);
    } catch (error) {
      console.error(error);
      toast.error("Erro ao criar o post.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <CourseLayout>
      <div className="container mx-auto px-4 py-16">
        <Card className="bg-card shadow-card">
          <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle className="text-2xl font-display text-foreground">Criar post</CardTitle>
              <p className="text-sm text-muted-foreground">
                Cadastre conteúdos que aparecerão na landing page.
              </p>
            </div>
            <Button asChild variant="outline">
              <Link to="/news">Voltar</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {canPublishNews ? (
              <NewsForm submitting={submitting} onSubmit={handleSubmit} submitLabel="Publicar post" />
            ) : (
              <p className="text-sm text-muted-foreground">Seu usuario nao possui permissao para publicar noticias.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </CourseLayout>
  );
};

export default NewsCreate;
