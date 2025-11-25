import CourseLayout from "@/components/CourseLayout";
import { MessageCircle, Users, Calendar } from "lucide-react";
import WhatsAppButton from "@/components/WhatsAppButton";

const CafeCultural = () => {
  return (
    <CourseLayout>
      <div className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-12 animate-fade-in">
            <h1 className="text-4xl md:text-6xl font-display font-bold mb-6 text-gradient-gold">
              Café Cultural
            </h1>
            <div className="w-24 h-1 bg-gradient-gold mx-auto mb-8"></div>
          </div>

          {/* Description */}
          <div className="bg-card rounded-2xl shadow-card p-8 md:p-12 mb-12 animate-fade-in-delay">
            <p className="text-lg md:text-xl text-muted-foreground leading-relaxed text-center mb-8">
              Um espaço de diálogo e partilha de ideias sobre temas humanos, culturais e contemporâneos. 
              Aberto ao público e com encontros regulares.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="flex flex-col items-center p-6 bg-secondary/30 rounded-xl">
                <Users className="w-10 h-10 text-primary mb-3" />
                <h3 className="font-semibold text-foreground mb-2">Encontros Abertos</h3>
                <p className="text-sm text-muted-foreground text-center">
                  Participe de discussões enriquecedoras
                </p>
              </div>

              <div className="flex flex-col items-center p-6 bg-secondary/30 rounded-xl">
                <Calendar className="w-10 h-10 text-primary mb-3" />
                <h3 className="font-semibold text-foreground mb-2">Encontros Regulares</h3>
                <p className="text-sm text-muted-foreground text-center">
                  Programação mensal com temas diversos
                </p>
              </div>

              <div className="flex flex-col items-center p-6 bg-secondary/30 rounded-xl">
                <MessageCircle className="w-10 h-10 text-primary mb-3" />
                <h3 className="font-semibold text-foreground mb-2">Comunidade Ativa</h3>
                <p className="text-sm text-muted-foreground text-center">
                  Conecte-se com pessoas inspiradoras
                </p>
              </div>
            </div>
          </div>

          {/* CTA Section */}
          <div className="bg-gradient-card rounded-2xl shadow-gold p-8 md:p-12 text-center animate-slide-up">
            <h3 className="text-2xl md:text-3xl font-display font-bold mb-4 text-foreground">
              Junte-se à Nossa Comunidade
            </h3>
            <p className="text-muted-foreground mb-8 text-lg">
              Entre no grupo do WhatsApp e receba informações sobre os próximos encontros e materiais exclusivos
            </p>
            
            <WhatsAppButton
              courseName="Café Cultural"
              variant="hero"
              size="lg"
              label="Participar do Próximo Encontro"
              className="text-lg px-10 py-6 h-auto"
            />

            <p className="text-sm text-muted-foreground mt-6">
              Ao clicar, você será redirecionado para o WhatsApp
            </p>
          </div>
        </div>
      </div>
    </CourseLayout>
  );
};

export default CafeCultural;
