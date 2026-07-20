import CourseLayout from "@/components/CourseLayout";
import CourseForm from "@/components/CourseForm";

const ValoresHumanos = () => {
  return (
    <CourseLayout>
      <div className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-12 animate-fade-in">
            <h1 className="text-4xl md:text-6xl font-display font-bold mb-6 text-gradient-gold">
              Valores Humanos: Base para a Autorrealização (VH)
            </h1>
            <div className="w-24 h-1 bg-gradient-gold mx-auto mb-8"></div>
            <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-3xl mx-auto">
              Desenvolva uma fundação sólida de valores para performar liderança, resultado e criatividade com propósito.
            </p>
          </div>

          {/* Quote */}
          <div className="bg-secondary/40 border border-border/60 rounded-2xl p-6 md:p-8 mb-10 shadow-card animate-fade-in-delay">
            <p className="text-center text-muted-foreground text-lg md:text-xl leading-relaxed italic">
              “O resultado tangível depende dos valores intangíveis.” — U.M.
            </p>
          </div>

          {/* Program Details */}
          <div className="bg-card rounded-2xl shadow-card p-8 md:p-12 space-y-8 animate-slide-up">
            <div className="space-y-3">
              <h2 className="text-2xl md:text-3xl font-display font-bold text-foreground">Propósito do Programa</h2>
              <p className="text-muted-foreground leading-relaxed">
                Formar a base para pessoas que desejam ser vencedoras, alcançando sucesso com um profundo propósito de
                vida. É um convite para viver para SER: realizar o projeto único que a vida confiou a você e dar sentido
                real à jornada, indo além do mero viver por viver.
              </p>
            </div>

            <div className="space-y-3">
              <h3 className="text-xl md:text-2xl font-display font-semibold text-foreground">Por que valores humanos?</h3>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li>Potencial pleno nasce de uma fundação interior — não de fatores externos.</li>
                <li>Exige coragem para olhar para dentro, romper padrões mentais e redesenhar estilo de vida e valores.</li>
                <li>Valores Universais e Atemporais pavimentam resultados sustentáveis, como mostram grandes líderes e gênios.</li>
              </ul>
            </div>

            <div className="space-y-3">
              <h3 className="text-xl md:text-2xl font-display font-semibold text-foreground">
                Metodologia de desenvolvimento e alta performance
              </h3>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li>
                  Aulas online ao vivo para estudo, reflexão e aprofundamento das temáticas centrais de cada ciclo.
                </li>
                <li>
                  Jornadas de imersão presencial com vivências práticas que consolidam novos padrões de valor e mudança
                  interior.
                </li>
                <li>
                  Ciclos de 3 a 6 meses, com temas específicos que conduzem a evolução contínua.
                </li>
              </ul>
            </div>

            <div className="space-y-3">
              <h3 className="text-xl md:text-2xl font-display font-semibold text-foreground">A quem se destina</h3>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li>Pessoas que querem elevar performance profissional e pessoal a um novo patamar.</li>
                <li>Indivíduos de qualquer idade ou área que buscam clareza, propósito e realização.</li>
                <li>Quem está pronto para olhar para dentro, construir sua base de valores e conquistar resultados com propósito.</li>
              </ul>
            </div>
          </div>

          {/* Form */}
          <div className="mt-10 animate-slide-up">
            <CourseForm
              courseId="valores-humanos"
              courseName="Valores Humanos: Base para a Autorrealização (VH)"
            />
          </div>
        </div>
      </div>
    </CourseLayout>
  );
};

export default ValoresHumanos;
