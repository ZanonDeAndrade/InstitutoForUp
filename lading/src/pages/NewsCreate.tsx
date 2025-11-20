import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import CourseLayout from "@/components/CourseLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import NewsForm from "@/components/NewsForm";
import { UpsertNewsDto } from "@/types/news";
import { newsApi } from "@/services/newsApi";
import { toast } from "sonner";

const NewsCreate = () => {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (payload: UpsertNewsDto) => {
    try {
      setSubmitting(true);
      const created = await newsApi.create(payload);
      toast.success("Notícia criada com sucesso.");
      navigate(`/admin/news/${created.slug}/edit`);
    } catch (error) {
      console.error(error);
      toast.error("Erro ao criar a notícia.");
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
              <CardTitle className="text-2xl font-display text-foreground">Criar notícia</CardTitle>
              <p className="text-sm text-muted-foreground">
                Cadastre conteúdos que aparecerão na landing page.
              </p>
            </div>
            <Button asChild variant="outline">
              <Link to="/admin/news">Voltar</Link>
            </Button>
          </CardHeader>
          <CardContent>
            <NewsForm submitting={submitting} onSubmit={handleSubmit} submitLabel="Publicar notícia" />
          </CardContent>
        </Card>
      </div>
    </CourseLayout>
  );
};

export default NewsCreate;
