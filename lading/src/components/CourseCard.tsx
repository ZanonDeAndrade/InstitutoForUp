import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

interface CourseCardProps {
  title: string;
  description: string;
  link: string;
  years?: number[];
  imageUrl?: string;
}

const MAX_DESCRIPTION_LENGTH = 260;

const stripLeadingTitle = (text: string, title: string) => {
  const trimmedText = text.trim();
  const trimmedTitle = title.trim();
  const normalizedText = trimmedText.toLowerCase();
  const normalizedTitle = trimmedTitle.toLowerCase();

  if (normalizedText.startsWith(normalizedTitle)) {
    const withoutTitle = trimmedText.slice(trimmedTitle.length).trimStart();
    return withoutTitle.replace(/^[-:.,\s]+/, "").trimStart() || trimmedText;
  }

  return trimmedText;
};

const CourseCard = ({ title, description, link, years, imageUrl }: CourseCardProps) => {
  const cleanedDescription = stripLeadingTitle(description, title);
  const isLong = cleanedDescription.length > MAX_DESCRIPTION_LENGTH;
  const shortDescription = isLong
    ? `${cleanedDescription.slice(0, MAX_DESCRIPTION_LENGTH).trimEnd()}...`
    : cleanedDescription;

  return (
    <Card className="bg-gradient-card border-border/50 hover:shadow-gold transition-all duration-300 hover:scale-105 group overflow-hidden">
      {imageUrl && (
        <div className="h-40 w-full overflow-hidden">
          <img
            src={imageUrl}
            alt={title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        </div>
      )}
      <CardHeader>
        {years?.length ? (
          <div className="mb-2 flex flex-wrap gap-2">
            {years.map((year) => (
              <span
                key={year}
                className="rounded-full border border-border bg-background/60 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-foreground"
              >
                {year}
              </span>
            ))}
          </div>
        ) : null}
        <CardTitle className="text-2xl font-display text-gradient-gold group-hover:scale-105 transition-transform">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <CardDescription className="text-muted-foreground text-base leading-relaxed text-justify">
          {shortDescription}{" "}
          {isLong && (
            <Link
              to={link}
              className="text-primary font-semibold hover:text-primary/80 underline underline-offset-4"
            >
              Ver mais
            </Link>
          )}
        </CardDescription>
      </CardContent>
      <CardFooter>
        <Link to={link} className="w-full">
          <Button variant="hero" className="w-full group-hover:shadow-xl">
            Saiba mais
            <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
};

export default CourseCard;
