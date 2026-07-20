import { useCallback, useEffect, useState } from "react";
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
import { adminNewsApi } from "@/services/adminNewsApi";
import { News } from "@/types/news";
import { toast } from "sonner";
import AdminLogoutButton from "@/components/AdminLogoutButton";
import { useAdminSession } from "@/lib/adminSessionContext";
import { ADMIN_PERMISSIONS, hasAdminPermission } from "@/lib/adminPermissions";

const NewsList = () => {
  const adminUser = useAdminSession();
  const canPublishNews = hasAdminPermission(adminUser, ADMIN_PERMISSIONS.PUBLISH_NEWS);
  const [items, setItems] = useState<News[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadNews = useCallback(async () => {
    if (!canPublishNews) {
      setLoading(false);
      setItems([]);
      return;
    }

    try {
      setLoading(true);
      const response = await adminNewsApi.list({ pageSize: 100 });
      setItems(response.items);
    } catch (error) {
      console.error(error);
      toast.error("Não foi possível carregar os posts do blog.");
    } finally {
      setLoading(false);
    }
  }, [canPublishNews]);

  useEffect(() => {
    loadNews();
  }, [loadNews]);

  const handleDelete = async (id: string) => {
    if (!canPublishNews) {
      toast.error("Acesso negado.");
      return;
    }

    setDeletingId(id);
    try {
      await adminNewsApi.delete(id);
      setItems((prev) => prev.filter((item) => item.id !== id));
      toast.success("Post excluído.");
    } catch (error) {
      console.error(error);
      toast.error("Erro ao excluir post.");
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
              <CardTitle className="text-2xl font-display text-foreground">Blog</CardTitle>
              <p className="text-sm text-muted-foreground">
                Gerencie publicações da landing page (draft ou publicadas).
              </p>
            </div>
            <div className="flex gap-3">
              <Button asChild variant="outline">
                <Link to="/">Voltar ao painel</Link>
              </Button>
              <Button asChild variant="hero">
                <Link to="/news/create">Criar post</Link>
              </Button>
              <AdminLogoutButton />
            </div>
          </CardHeader>
          <CardContent>
            {!canPublishNews && (
              <p className="text-sm text-muted-foreground">Seu usuario nao possui permissao para gerenciar noticias.</p>
            )}
            {canPublishNews && (
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
                          <Link to={`/news/${item.slug}`} target="_blank" rel="noopener noreferrer">
                            Ver
                          </Link>
                        </Button>
                        <Button variant="outline" size="sm" asChild>
                          <Link to={`/news/${item.slug}/edit`}>Editar</Link>
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
                {!items.length && !loading && <TableCaption>Nenhum post cadastrado.</TableCaption>}
                {loading && <TableCaption>Carregando posts...</TableCaption>}
              </Table>
            </div>
            )}
          </CardContent>
        </Card>
      </div>
    </CourseLayout>
  );
};

export default NewsList;
