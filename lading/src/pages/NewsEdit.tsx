import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import CourseLayout from "@/components/CourseLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import NewsForm from "@/components/NewsForm";
import { News, UpsertNewsDto } from "@/types/news";
import { adminNewsApi } from "@/services/adminNewsApi";
import { toast } from "sonner";
import { useAdminSession } from "@/lib/adminSessionContext";
import { ADMIN_PERMISSIONS, hasAdminPermission } from "@/lib/adminPermissions";

const NewsEdit = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const adminUser = useAdminSession();
  const canPublishNews = hasAdminPermission(adminUser, ADMIN_PERMISSIONS.PUBLISH_NEWS);
  const [item, setItem] = useState<News | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const loadNews = useCallback(async (currentSlug: string) => {
    if (!canPublishNews) {
      setLoading(false);
      setItem(null);
      return;
    }

    try {
      setLoading(true);
      const data = await adminNewsApi.getBySlug(currentSlug);
      setItem(data);
    } catch (error) {
      console.error(error);
      toast.error("Post não encontrado.");
    } finally {
      setLoading(false);
    }
  }, [canPublishNews]);

  useEffect(() => {
    if (slug) {
      loadNews(slug);
    }
  }, [loadNews, slug]);

  const handleSubmit = async (payload: UpsertNewsDto) => {
    if (!item) return;
    if (!canPublishNews) {
      toast.error("Acesso negado.");
      return;
    }

    try {
      setSubmitting(true);
      const updated = await adminNewsApi.update(item.id, payload);
      setItem(updated);
      toast.success("Post atualizado.");
      if (updated.slug !== slug) {
        navigate(`/news/${updated.slug}/edit`, { replace: true });
      }
    } catch (error) {
      console.error(error);
      toast.error("Erro ao atualizar post.");
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
              <CardTitle className="text-2xl font-display text-foreground">
                {item ? `Editando: ${item.title}` : "Editar post"}
              </CardTitle>
              <p className="text-sm text-muted-foreground">Ajuste conteúdo, imagem e status.</p>
            </div>
            <div className="flex gap-2">
              <Button asChild variant="outline">
                <Link to="/news">Voltar</Link>
              </Button>
              {item && (
                <Button asChild variant="secondary">
                  <Link to={`/news/${item.slug}`} target="_blank" rel="noopener noreferrer">
                    Ver publicação
                  </Link>
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {!canPublishNews && (
              <p className="text-sm text-muted-foreground">Seu usuario nao possui permissao para publicar noticias.</p>
            )}
            {canPublishNews && (
              <>
            {loading && <p className="text-muted-foreground">Carregando post...</p>}
            {!loading && item && (
              <NewsForm
                initial={item}
                submitting={submitting}
                onSubmit={handleSubmit}
                submitLabel="Salvar alterações"
              />
            )}
            {!loading && !item && (
              <p className="text-destructive">Não foi possível localizar este post.</p>
            )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </CourseLayout>
  );
};

export default NewsEdit;
