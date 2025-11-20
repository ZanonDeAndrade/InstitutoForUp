import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import CourseLayout from "@/components/CourseLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { newsApi } from "@/services/newsApi";
import { News } from "@/types/news";
import { toast } from "sonner";

const NewsList = () => {
  const [items, setItems] = useState<News[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadNews = async () => {
    try {
      setLoading(true);
      const response = await newsApi.list({ pageSize: 100 });
      setItems(response.items);
    } catch (error) {
      console.error(error);
      toast.error("Não foi possível carregar as notícias.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNews();
  }, []);

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await newsApi.delete(id);
      setItems((prev) => prev.filter((item) => item.id !== id));
      toast.success("Notícia excluída.");
    } catch (error) {
      console.error(error);
      toast.error("Erro ao excluir notícia.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <CourseLayout>
      <div className="container mx-auto px-4 py-16">
        <Card className="bg-card shadow-card">
          <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle className="text-2xl font-display text-foreground">Notícias</CardTitle>
              <p className="text-sm text-muted-foreground">
                Gerencie publicações da landing page (draft ou publicadas).
              </p>
            </div>
            <div className="flex gap-3">
              <Button asChild variant="outline">
                <Link to="/admin">Voltar ao painel</Link>
              </Button>
              <Button asChild variant="hero">
                <Link to="/admin/news/create">Criar notícia</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-secondary/40">
                  <TableRow>
                    <TableHead>Título</TableHead>
                    <TableHead>Slug</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">
                        <div className="flex flex-col">
                          <span className="text-foreground">{item.title}</span>
                          {item.subtitle && (
                            <span className="text-xs text-muted-foreground line-clamp-1">
                              {item.subtitle}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{item.slug}</TableCell>
                      <TableCell className="text-right space-x-2 whitespace-nowrap">
                        <Button variant="secondary" size="sm" asChild>
                          <Link to={`/news/${item.slug}`} target="_blank" rel="noreferrer">
                            Ver
                          </Link>
                        </Button>
                        <Button variant="outline" size="sm" asChild>
                          <Link to={`/admin/news/${item.slug}/edit`}>Editar</Link>
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          disabled={deletingId === item.id}
                          onClick={() => handleDelete(item.id)}
                        >
                          {deletingId === item.id ? "Excluindo..." : "Excluir"}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                {!items.length && !loading && <TableCaption>Nenhuma notícia cadastrada.</TableCaption>}
                {loading && <TableCaption>Carregando notícias...</TableCaption>}
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </CourseLayout>
  );
};

export default NewsList;
