import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import CourseLayout from "@/components/CourseLayout";
import { Button } from "@/components/ui/button";
import { News } from "@/types/news";
import { newsApi } from "@/services/newsApi";
import { getSafeImageUrl, renderSafeMarkdown } from "@/lib/safeMarkdown";

const formatDate = (value?: string | null) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
};

const NewsDetails = () => {
  const { slug } = useParams<{ slug: string }>();
  const [news, setNews] = useState<News | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!slug) return;
      try {
        const data = await newsApi.getBySlug(slug);
        setNews(data);
      } catch (error) {
        console.error(error);
        setNews(null);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [slug]);

  const renderContent = () => {
    if (!news) return null;
    const html = renderSafeMarkdown(news.content || "");
    return { __html: html };
  };

  const imageUrl = getSafeImageUrl(news?.imageUrl);

  return (
    <CourseLayout>
      <div className="container mx-auto max-w-5xl px-4 py-16">
        {loading && <p className="text-muted-foreground">Carregando post...</p>}
        {!loading && !news && (
          <div className="space-y-3">
            <p className="text-destructive">Post não encontrado.</p>
            <Button asChild variant="outline">
              <Link to="/news">Ver todos os posts</Link>
            </Button>
          </div>
        )}

        {news && (
          <article className="space-y-8">
            <div className="space-y-2">
              <p className="text-sm uppercase tracking-[0.15em] text-primary/80">
                {formatDate(news.publishedAt)}
              </p>
              <h1 className="text-4xl md:text-5xl font-display font-bold text-foreground">
                {news.title}
              </h1>
              {news.subtitle && <p className="text-lg text-muted-foreground">{news.subtitle}</p>}
            </div>

            {imageUrl && (
              <div className="overflow-hidden rounded-2xl shadow-lg">
                <img
                  src={imageUrl}
                  alt={news.title}
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              </div>
            )}

            <div
              className="prose prose-neutral prose-invert max-w-none space-y-4 text-foreground"
              dangerouslySetInnerHTML={renderContent() || undefined}
            />

            <div className="flex gap-3 pt-2">
              <Button asChild variant="secondary">
                <Link to="/news">Voltar</Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/">Ir para a home</Link>
              </Button>
            </div>
          </article>
        )}
      </div>
    </CourseLayout>
  );
};

export default NewsDetails;
