import CourseLayout from "@/components/CourseLayout";
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
          <div className="bg-card rounded-2xl shadow-card p-8 md:p-12 mb-12 animate-fade-in-delay space-y-8 text-justify">
            <div className="text-lg md:text-xl text-muted-foreground leading-relaxed space-y-3 text-justify">
              <p className="text-lg md:text-xl">
                Um programa aberto e gratuito desenhado para elevar o humanismo, a autoestima e a dignidade humana,
                reacendendo o prazer de viver em direção à autorrealização e ao sucesso na própria vida.
              </p>
            </div>

            <div className="space-y-3">
              <p className="text-foreground font-semibold text-lg md:text-xl">O Poder da Reflexão e do Legado</p>
              <p className="text-muted-foreground leading-relaxed text-justify text-lg md:text-xl">
                O Café Cultural é um espaço de inspiração e crescimento, baseado na sabedoria que moldou a humanidade.
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground leading-relaxed text-justify text-lg md:text-xl">
                <li>Valores em Foco: Encontros mensais dedicados à leitura e à reflexão profunda sobre os Valores Humanos universais.</li>
                <li>Fontes de Inspiração: Inspirados nos grandes pensadores e lideranças mundiais – tanto contemporâneos quanto perenes, cujos legados (obras e realizações) nos beneficiam até hoje.</li>
              </ul>
            </div>

            <div className="space-y-3">
              <p className="text-foreground font-semibold text-lg md:text-xl">Elevando o Nível Cultural e Pessoal</p>
              <p className="text-muted-foreground leading-relaxed text-justify text-lg md:text-xl">O Café Cultural vai além da simples leitura:</p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground leading-relaxed text-justify text-lg md:text-xl">
                <li>Ele instiga a mente, abrindo a curiosidade para novos horizontes.</li>
                <li>Proporciona um debate leve e prazeroso sobre temas profundos.</li>
                <li>Eleva o seu nível cultural, reforçando a ideia de que ser culto é um sinal de nobreza interior.</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed text-justify text-lg md:text-xl">
                No final de cada encontro, os participantes saem inspirados, com ímpeto renovado e a "vontade de fazer mais" em suas vidas.
              </p>
            </div>

            <div className="space-y-3">
              <p className="text-foreground font-semibold text-lg md:text-xl">Informações Práticas</p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground leading-relaxed text-justify text-lg md:text-xl">
                <li>Frequência: Encontros mensais.</li>
                <li>Dia: Última quarta-feira de cada mês.</li>
                <li>Próximo Ciclo: Inicia em Fevereiro de 2026.</li>
              </ul>
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
