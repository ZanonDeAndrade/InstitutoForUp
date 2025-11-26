import CourseLayout from "@/components/CourseLayout";
import { MessageCircle, Users, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";

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
            <div className="text-lg md:text-xl text-muted-foreground leading-relaxed text-center mb-8 space-y-4">
              <p>
                O Café Cultural é um grupo de estudos com encontros realizados mensalmente, dedicados a mergulhar na
                história da inteligência humana. Nosso objetivo é analisar e debater personalidades e assuntos que
                representam o auge da inovação e do conhecimento.
              </p>
              <p>
                A cada ciclo, exploramos grandes mentes (como cientistas, filósofos e artistas) e temas que nos ajudam a
                entender o momento histórico e a capacidade de pensar da humanidade. O encontro é um momento de alegria
                e prazer, sem formalidades excessivas, onde se busca conhecer mais de forma prazerosa.
              </p>
              <p>
                O foco é no estudo detalhado, mas acessível, gerando aprendizados valiosos para a vida toda. As
                personalidades estudadas são analisadas através dos seguintes elementos: as formas de mentes,
                performances, habilidades, estilos de vida, culturas, educação, valores humanos e escolhas que as levaram
                a alcançar realizações de ponta. O principal é entender esses componentes de uma forma leve e informativa.
              </p>
              <p>
                O formato de nosso encontro mensal inclui o compartilhamento de material curado para estudo prévio, uma
                apresentação detalhada do tema e, no coração do evento, um debate cultural aberto e crítico. O Café
                Cultural é um espaço multidisciplinar que reúne pessoas de diversas áreas, unidas pela curiosidade, em um
                ambiente acolhedor e estimulante.
              </p>
            </div>

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
            
            <Button
              asChild
              variant="hero"
              size="lg"
              className="text-lg px-10 py-6 h-auto"
            >
              <a
                href="https://chat.whatsapp.com/Cpxf7ujEIQZEck6REKrlP6"
                target="_blank"
                rel="noopener noreferrer"
              >
                Participar do Próximo Encontro
              </a>
            </Button>

            <p className="text-sm text-muted-foreground mt-6">
              Ao clicar, você será redirecionado para o grupo do WhatsApp.
            </p>
          </div>
        </div>
      </div>
    </CourseLayout>
  );
};

export default CafeCultural;
