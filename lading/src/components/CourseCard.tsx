import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

interface CourseCardProps {
  title: string;
  description: string;
  link: string;
  imageUrl?: string;
}

const CourseCard = ({ title, description, link, imageUrl }: CourseCardProps) => {
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
        <CardTitle className="text-2xl font-display text-gradient-gold group-hover:scale-105 transition-transform">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <CardDescription className="text-muted-foreground text-base leading-relaxed">
          {description}
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
