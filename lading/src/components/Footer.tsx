import { Facebook, Instagram, Linkedin } from "lucide-react";

const Footer = () => {
  const socials = [
    { href: "https://www.linkedin.com/company/109994575/admin/dashboard/", label: "LinkedIn", icon: Linkedin },
    { href: "https://www.instagram.com/instituto_for_up_education/", label: "Instagram", icon: Instagram },
    { href: "https://www.facebook.com/profile.php?id=61582707766997&locale=pt_BR", label: "Facebook", icon: Facebook },
  ];

  return (
    <footer className="bg-secondary/50 backdrop-blur-sm border-t border-border mt-20">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="flex items-center gap-3">
            {socials.map(({ href, label, icon: Icon }) => (
              <a
                key={href}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-border/60 bg-card text-foreground transition hover:-translate-y-0.5 hover:border-primary/60 hover:text-primary"
              >
                <Icon className="h-5 w-5" />
              </a>
            ))}
          </div>

          <p className="text-sm text-muted-foreground">
            © 2025 Instituto FOR UP Education — Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
