import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import CourseLayout from "@/components/CourseLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import NewsForm from "@/components/NewsForm";
import { News, UpsertNewsDto } from "@/types/news";
import { newsApi } from "@/services/newsApi";
import { toast } from "sonner";

const NewsEdit = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [item, setItem] = useState<News | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const loadNews = async (currentSlug: string) => {
    try {
      setLoading(true);
      const data = await newsApi.getBySlug(currentSlug, true);
      setItem(data);
    } catch (error) {
      console.error(error);
      toast.error("Post não encontrado.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (slug) {
      loadNews(slug);
    }
  }, [slug]);

  const handleSubmit = async (payload: UpsertNewsDto) => {
    if (!item) return;
    try {
      setSubmitting(true);
      const updated = await newsApi.update(item.id, payload);
      setItem(updated);
      toast.success("Post atualizado.");
      if (updated.slug !== slug) {
        navigate(`/admin/news/${updated.slug}/edit`, { replace: true });
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
                <Link to="/admin/news">Voltar</Link>
              </Button>
              {item && (
                <Button asChild variant="secondary">
                  <Link to={`/news/${item.slug}`} target="_blank" rel="noreferrer">
                    Ver publicação
                  </Link>
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
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
          </CardContent>
        </Card>
      </div>
    </CourseLayout>
  );
};

export default NewsEdit;
