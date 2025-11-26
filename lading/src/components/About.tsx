import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";

const About = () => {
  return (
    <section id="sobre" className="py-20 px-4">
      <div className="container mx-auto max-w-5xl md:max-w-6xl">
        <div className="bg-card rounded-2xl shadow-card p-6 sm:p-8 md:p-12 lg:p-14 animate-fade-in">
          <h2 className="text-4xl md:text-5xl font-display font-bold text-center mb-8 text-gradient-gold">
            Sobre o Instituto FORUP Education
          </h2>

          <Carousel opts={{ align: "start", loop: false }} autoHeight className="mt-4 md:mt-6">
            <CarouselContent className="gap-4 items-start pb-2">
              <CarouselItem className="basis-full">
                <div className="space-y-4 text-muted-foreground text-base sm:text-lg leading-relaxed md:text-xl">
                  <p className="text-foreground font-semibold text-lg sm:text-xl md:text-2xl">Nossa história</p>
                  <p>
                    O Instituto FOR UP Education nasce após anos formando pessoas em valores humanos, liderança,
                    performance em resultados e evolução criativa pela Ueno Profit. Fundado em 15 de outubro de 2025,
                    homenageia milhares de educadores que dedicam suas vidas a desenvolver gente.
                  </p>
                  <p>
                    Somos movidos por ver pessoas vencerem: autorrealizadas, de alta performance e felizes. Essa é
                    nossa paixão e o motivo de existirmos. A sua felicidade é a nossa felicidade.
                  </p>
                </div>
              </CarouselItem>

              <CarouselItem className="basis-full">
                <div className="space-y-6 text-muted-foreground text-base sm:text-lg leading-relaxed md:text-xl">
                  <div>
                    <p className="text-foreground font-semibold text-lg sm:text-xl md:text-2xl">Missão</p>
                    <p className="mt-2">
                      Formar pessoas pela visão humanista, liderança e criatividade, contribuindo para uma sociedade
                      mais evoluída.
                    </p>
                  </div>
                  <div>
                    <p className="text-foreground font-semibold text-lg sm:text-xl md:text-2xl">Propósito</p>
                    <p className="mt-2">
                      Desenvolver pessoas vencedoras por meio da formação em valores humanos e da liderança orientada a
                      resultado e criatividade.
                    </p>
                  </div>
                </div>
              </CarouselItem>

              <CarouselItem className="basis-full">
                <div className="space-y-4 text-muted-foreground text-base sm:text-lg leading-relaxed md:text-xl">
                  <p className="text-foreground font-semibold text-lg sm:text-xl md:text-2xl">Pilares de formação</p>
                  <ul className="list-disc list-inside space-y-2">
                    <li>Valores humanos</li>
                    <li>Liderança e resultado</li>
                    <li>Criatividade empresarial</li>
                  </ul>
                  <div>
                    <p className="text-foreground font-semibold text-lg sm:text-xl md:text-2xl">Core business</p>
                    <p className="mt-2">
                      Formação em valores humanos, liderança e criatividade.
                    </p>
                  </div>
                </div>
              </CarouselItem>

              <CarouselItem className="basis-full">
                <div className="space-y-4 text-muted-foreground text-base sm:text-lg leading-relaxed md:text-xl">
                  <p className="text-foreground font-semibold text-lg sm:text-xl md:text-2xl">Valores que nos guiam</p>
                  <ul className="mt-2 list-disc list-inside space-y-1">
                    <li>Humanismo</li>
                    <li>Protagonismo</li>
                    <li>Meritocracia</li>
                    <li>Excelência</li>
                    <li>Criatividade</li>
                  </ul>
                </div>
              </CarouselItem>
            </CarouselContent>
            <div className="mt-4 flex justify-center gap-3 sm:justify-between sm:px-6">
              <CarouselPrevious className="static translate-y-0 top-auto left-auto h-9 w-9 sm:h-10 sm:w-10" />
              <CarouselNext className="static translate-y-0 top-auto left-auto h-9 w-9 sm:h-10 sm:w-10" />
            </div>
          </Carousel>
        </div>
      </div>
    </section>
  );
};

export default About;
