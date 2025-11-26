import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import heroImage from "@/assets/hero-education.jpg";

const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <img 
          src={heroImage} 
          alt="Educação e Liderança" 
          className="w-full h-full object-cover opacity-20"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/60 to-background"></div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 z-10">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl md:text-7xl font-display font-bold text-foreground mb-6 animate-fade-in leading-tight">
            Formando Pessoas para o{" "}
            <span className="text-gradient-gold">Futuro</span>
            <br />
            com Consciência e Propósito
          </h1>
          
          <p className="text-xl md:text-2xl text-muted-foreground mb-10 animate-fade-in-delay leading-relaxed max-w-3xl mx-auto">
            O Instituto FOR UP Education oferece programas voltados ao desenvolvimento humano e à liderança com valores.
          </p>

          <div className="animate-slide-up">
            <Button 
              variant="hero" 
              size="lg" 
              className="text-lg px-10 py-6 h-auto"
              onClick={() => {
                document.getElementById('cursos')?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              Conheça nossos cursos
              <ArrowRight className="ml-2" />
            </Button>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 border-2 border-primary rounded-full flex items-start justify-center p-2">
          <div className="w-1 h-3 bg-primary rounded-full"></div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
