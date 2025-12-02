import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronDown, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import logo from "@/assets/Logo.png";

type NavLink = {
  id: string;
  label: string;
  to?: string;
  children?: { label: string; to: string }[];
};

const PROGRAM_YEARS = [2025, 2026] as const;

const navLinks: NavLink[] = [
  { id: "home", to: "/", label: "Home" },
  { id: "sobre", to: "/#sobre", label: "Sobre nós" },
  {
    id: "programacao",
    label: "Programação",
    children: PROGRAM_YEARS.map((year) => ({
      to: `/#cursos-${year}`,
      label: `Programação ${year}`,
    })),
  },
  { id: "blog", to: "/news", label: "Blog" },
  { id: "contato", to: "/#contato", label: "Contato" },
];

const Header = () => {
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [openMobileDropdown, setOpenMobileDropdown] = useState<string | null>(null);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3 group">
            <img
              src={logo}
              alt="Instituto FOR UP Education"
              className="h-14 w-auto object-contain transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
            />
            <div className="hidden md:block">
              <h1 className="text-xl font-display font-bold text-foreground leading-tight">
                Instituto FOR UP
              </h1>
              <p className="text-xs text-muted-foreground">Education</p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) =>
              link.children ? (
                <div
                  key={link.id}
                  className="relative"
                  onMouseEnter={() => setOpenDropdown(link.id)}
                  onMouseLeave={() => setOpenDropdown(null)}
                >
                  <button
                    type="button"
                    className="flex items-center gap-1 text-foreground hover:text-primary transition-colors font-medium"
                    onClick={() => setOpenDropdown((current) => (current === link.id ? null : link.id))}
                  >
                    {link.label}
                    <ChevronDown
                      className={`h-4 w-4 transition-transform ${
                        openDropdown === link.id ? "-scale-y-100" : ""
                      }`}
                    />
                  </button>
                  {openDropdown === link.id && (
                    <div className="absolute left-0 top-full z-20 w-48 rounded-xl border border-border bg-popover shadow-lg py-2">
                      {link.children.map((child) => (
                        <a
                          key={child.to}
                          href={child.to}
                          className="block rounded-lg px-3 py-2 text-sm font-medium text-foreground hover:bg-muted"
                          onClick={() => setOpenDropdown(null)}
                        >
                          {child.label}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <a
                  key={link.id}
                  href={link.to}
                  className="text-foreground hover:text-primary transition-colors font-medium"
                >
                  {link.label}
                </a>
              ),
            )}
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
                {navLinks.map((link) =>
                  link.children ? (
                    <div key={link.id} className="flex flex-col space-y-2">
                      <button
                        type="button"
                        className="flex items-center justify-between text-lg font-medium text-foreground hover:text-primary transition-colors"
                        onClick={() =>
                          setOpenMobileDropdown((current) =>
                            current === link.id ? null : link.id,
                          )
                        }
                      >
                        {link.label}
                        <ChevronDown
                          className={`h-5 w-5 transition-transform ${
                            openMobileDropdown === link.id ? "-scale-y-100" : ""
                          }`}
                        />
                      </button>
                      {openMobileDropdown === link.id && (
                        <div className="ml-4 flex flex-col space-y-2 border-l border-border pl-3">
                          {link.children.map((child) => (
                            <a
                              key={child.to}
                              href={child.to}
                              className="text-base font-medium text-foreground hover:text-primary transition-colors"
                              onClick={() => setOpenMobileDropdown(null)}
                            >
                              {child.label}
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <a
                      key={link.id}
                      href={link.to}
                      className="text-lg font-medium text-foreground hover:text-primary transition-colors"
                    >
                      {link.label}
                    </a>
                  ),
                )}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
};

export default Header;
