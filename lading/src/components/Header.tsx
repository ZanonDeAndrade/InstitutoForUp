import { Link } from "react-router-dom";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import logo from "@/assets/Logo.jpg";

const Header = () => {
  const navLinks = [
    { to: "/", label: "Home" },
    { to: "/#cursos", label: "Cursos" },
    { to: "/news", label: "Notícias" },
    { to: "/#contato", label: "Contato" },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="w-12 h-12 rounded-lg overflow-hidden shadow-gold ring-1 ring-border/60 bg-secondary/40 flex items-center justify-center group-hover:shadow-xl transition-all duration-300">
              <img
                src={logo}
                alt="Instituto ForUp Education"
                className="h-full w-full object-contain"
                loading="lazy"
              />
            </div>
            <div className="hidden md:block">
              <h1 className="text-xl font-display font-bold text-foreground leading-tight">
                Instituto ForUp
              </h1>
              <p className="text-xs text-muted-foreground">Education</p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <a
                key={link.to}
                href={link.to}
                className="text-foreground hover:text-primary transition-colors font-medium"
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* Mobile Navigation */}
          <Sheet>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent>
              <nav className="flex flex-col space-y-4 mt-8">
                {navLinks.map((link) => (
                  <a
                    key={link.to}
                    href={link.to}
                    className="text-lg font-medium text-foreground hover:text-primary transition-colors"
                  >
                    {link.label}
                  </a>
                ))}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
};

export default Header;
