import { Link } from "react-router-dom";
import { News } from "@/types/news";
interface NewsCardProps {
  news: News;
}

const formatDate = (value?: string | null) => {
  if (!value) return "Data a definir";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Data a definir";
  return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
};

const buildExcerpt = (content: string, subtitle?: string | null) => {
  if (subtitle) return subtitle;
  if (!content) return "";
  const clean = content.replace(/[#*_>\-\n]+/g, " ").trim();
  return clean.length > 140 ? `${clean.slice(0, 140)}...` : clean;
};

const NewsCard = ({ news }: NewsCardProps) => {
  const excerpt = buildExcerpt(news.content, news.subtitle);
  return (
    <Link
      to={`/news/${news.slug}`}
      className="group block h-full overflow-hidden rounded-2xl border border-border/60 bg-card shadow-card transition hover:-translate-y-1 hover:shadow-xl"
    >
      {news.imageUrl && (
        <div className="h-44 w-full overflow-hidden">
          <img
            src={news.imageUrl}
            alt={news.title}
            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
            loading="lazy"
          />
        </div>
      )}
      <div className="flex h-full flex-col gap-3 p-5">
        <div className="flex items-center justify-between">
          <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">
            {formatDate(news.publishedAt)}
          </p>
        </div>
        <h3 className="text-xl font-display font-semibold text-foreground leading-snug">
          {news.title}
        </h3>
        {excerpt && <p className="text-sm text-muted-foreground line-clamp-3">{excerpt}</p>}
        <div className="mt-auto flex items-center gap-2 text-sm font-semibold text-primary">
          Ler mais
          <span aria-hidden>→</span>
        </div>
      </div>
    </Link>
  );
};

export default NewsCard;
