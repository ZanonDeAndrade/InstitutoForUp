import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronDown, Instagram, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { PILLARS } from "@/constants/pillars";
import logo from "@/assets/Logo.png";

type HeaderProps = {
  minimal?: boolean;
};

type NavLink = {
  id: string;
  label: string;
  to?: string;
  children?: { label: string; to: string }[];
};

const navLinks: NavLink[] = [
  { id: "home", to: "/", label: "Home" },
  { id: "sobre", to: "/#sobre", label: "Sobre nós" },
  {
    id: "programacao",
    label: "Programação",
    children: PILLARS.map((pillar) => ({
      to: `/#pilar-${pillar.id}`,
      label: pillar.label,
    })),
  },
  { id: "blog", to: "/news", label: "Blog" },
  { id: "contato", to: "/#contato", label: "Contato" },
];

const WHATSAPP_NUMBER = "5511976747650";
const WhatsAppLogo = ({ className }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 32 32"
    fill="currentColor"
    aria-hidden="true"
  >
    <path d="M27.1 4.9A15.6 15.6 0 0 0 16 0C7.6 0 .7 6.6.7 14.8c0 2.6.7 5.2 2 7.5L0 32l10-2.6a16 16 0 0 0 6 1.2c8.4 0 15.3-6.6 15.3-14.8 0-3.9-1.7-7.6-4.2-10zM16 28.4a12.8 12.8 0 0 1-5.2-1.1l-.4-.2-5.9 1.5 1.6-5.6-.2-.4a12.2 12.2 0 0 1-1.8-6.4c0-6.7 5.6-12.1 12.5-12.1 3.3 0 6.4 1.3 8.7 3.6 2.3 2.3 3.6 5.4 3.6 8.7 0 6.7-5.6 12.1-12.9 12.1zm7-9.1c-.1-.2-.5-.3-1-.6-.5-.3-3.1-1.5-3.6-1.6-.5-.2-.8-.3-1.1.3-.3.7-1.2 1.6-1.5 1.9-.2.2-.3.3-.6.1-.3-.2-1.2-.5-2.3-1.4-.8-.7-1.3-1.5-1.5-1.8-.2-.3 0-.4.2-.6l.6-.7.3-.4c.1-.2.1-.3 0-.5l-1-2.6c-.3-.6-.6-.5-.9-.5h-.8c-.3 0-.7.1-1 .4-.4.5-1.4 1.3-1.4 3.2 0 2 1.4 3.9 1.6 4.2.2.3 2.7 4.3 6.7 5.8 1 .4 1.8.6 2.4.8 1 .2 1.9.2 2.6.1.8-.1 2.7-1.1 3-2.2.4-1 .4-1.8.3-2 0-.2-.2-.3-.4-.4z" />
  </svg>
);
const SOCIAL_LINKS = [
  { id: "instagram", href: "https://www.instagram.com/instituto_for_up_education/", label: "Instagram", icon: Instagram },
  { id: "whatsapp", href: `https://wa.me/${WHATSAPP_NUMBER}`, label: "WhatsApp", icon: WhatsAppLogo },
] as const;

const Header = ({ minimal = false }: HeaderProps) => {
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
          {!minimal && (
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
          )}

          {/* Desktop Socials */}
          {!minimal && (
            <div className="hidden md:flex items-center gap-3">
              {SOCIAL_LINKS.map(({ id, href, label, icon: Icon }) => (
                <a
                  key={id}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border bg-background/70 text-foreground transition hover:-translate-y-0.5 hover:border-primary hover:text-primary"
                >
                  <Icon className="h-5 w-5" />
                </a>
              ))}
            </div>
          )}

          {/* Mobile Navigation */}
          {!minimal && (
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
                  <div className="flex items-center gap-3 pt-4 border-t border-border">
                    {SOCIAL_LINKS.map(({ id, href, label, icon: Icon }) => (
                      <a
                        key={id}
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={label}
                        className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border bg-background text-foreground transition hover:border-primary hover:text-primary"
                      >
                        <Icon className="h-5 w-5" />
                      </a>
                    ))}
                  </div>
                </nav>
              </SheetContent>
            </Sheet>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
