import { useEffect, useMemo, useState } from "react";
import CourseLayout from "@/components/CourseLayout";
import NewsCard from "@/components/NewsCard";
import { newsApi } from "@/services/newsApi";
import { News } from "@/types/news";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const PAGE_SIZE = 6;

const NewsPage = () => {
  const [items, setItems] = useState<News[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / PAGE_SIZE)), [total]);

  const load = async (currentPage: number) => {
    try {
      setLoading(true);
      const result = await newsApi.list({ page: currentPage, pageSize: PAGE_SIZE });
      setItems(result.items);
      setTotal(result.total);
    } catch (error) {
      console.error(error);
      toast.error("Não foi possível carregar as notícias.");
      setItems([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(page);
  }, [page]);

  const canPrev = page > 1;
  const canNext = page < totalPages;

  return (
    <CourseLayout>
      <div className="container mx-auto px-4 py-16">
        <div className="mb-10 space-y-3 text-center">
          <p className="text-sm uppercase tracking-[0.15em] text-primary/80">Novidades</p>
          <h1 className="text-4xl md:text-5xl font-display font-bold text-foreground">Notícias</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Fique por dentro das atualizações, eventos e artigos do Instituto FORUP.
          </p>
        </div>

        {loading && <p className="text-center text-muted-foreground">Carregando notícias...</p>}

        {!loading && items.length === 0 && (
          <p className="text-center text-muted-foreground">Nenhuma notícia publicada ainda.</p>
        )}

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <NewsCard key={item.id} news={item} />
          ))}
        </div>

        {!loading && totalPages > 1 && (
          <div className="mt-10 flex items-center justify-center gap-4">
            <Button
              variant="outline"
              disabled={!canPrev}
              onClick={() => canPrev && setPage((prev) => Math.max(1, prev - 1))}
            >
              Anterior
            </Button>
            <span className="text-sm text-muted-foreground">
              Página {page} de {totalPages}
            </span>
            <Button
              variant="outline"
              disabled={!canNext}
              onClick={() => canNext && setPage((prev) => prev + 1)}
            >
              Próxima
            </Button>
          </div>
        )}
      </div>
    </CourseLayout>
  );
};

export default NewsPage;
