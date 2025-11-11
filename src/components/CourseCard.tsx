import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

interface CourseCardProps {
  title: string;
  description: string;
  link: string;
}

const CourseCard = ({ title, description, link }: CourseCardProps) => {
  return (
    <Card className="bg-gradient-card border-border/50 hover:shadow-gold transition-all duration-300 hover:scale-105 group">
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
