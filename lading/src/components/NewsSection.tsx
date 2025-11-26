import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import NewsCard from "./NewsCard";
import { newsApi } from "@/services/newsApi";
import { News } from "@/types/news";

const NewsSection = () => {
  const [items, setItems] = useState<News[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const latest = await newsApi.latest(3);
        setItems(latest);
      } catch (error) {
        console.warn("Falha ao carregar notícias", error);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (!loading && items.length === 0) {
    return null;
  }

  return (
    <section id="noticias" className="bg-gradient-to-b from-background via-card to-background py-20 px-4">
      <div className="container mx-auto max-w-6xl">
        <div className="flex flex-col items-start gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.15em] text-primary/80">Novidades</p>
            <h2 className="text-4xl md:text-5xl font-display font-bold text-foreground">
              Últimas notícias
            </h2>
            <p className="text-muted-foreground mt-2 max-w-2xl">
              Artigos, eventos e comunicados do Instituto FORUP.
            </p>
          </div>
          <ButtonLink />
        </div>

        {loading && <p className="mt-8 text-muted-foreground">Carregando notícias...</p>}

        <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {items.map((news) => (
            <NewsCard key={news.id} news={news} />
          ))}
        </div>
      </div>
    </section>
  );
};

const ButtonLink = () => (
  <Link
    to="/news"
    className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-card px-4 py-2 text-sm font-semibold text-foreground shadow-sm transition hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-lg"
  >
    Ver todas
    <span aria-hidden>→</span>
  </Link>
);

export default NewsSection;
