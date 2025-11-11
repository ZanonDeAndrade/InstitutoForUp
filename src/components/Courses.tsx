import CourseCard from "./CourseCard";

const Courses = () => {
  const courses = [
    {
      title: "Critérios e Valores Humanos",
      description: "Um programa que busca resgatar a essência dos valores que guiam a ação humana e sustentam decisões éticas e conscientes. Ideal para quem deseja alinhar propósito e resultados.",
      link: "/criterios-valores"
    },
    {
      title: "Performando Lideranças",
      description: "Desenvolva as competências essenciais para liderar pessoas e projetos com autenticidade, clareza e impacto. Um percurso prático para quem quer transformar potencial em realização.",
      link: "/performando-liderancas"
    },
    {
      title: "Jovens Líderes",
      description: "Voltado a jovens que desejam descobrir seu papel no mundo e desenvolver liderança com base em valores humanos e responsabilidade social.",
      link: "/jovens-lideres"
    },
    {
      title: "Criatividade Empresarial",
      description: "Programa voltado a empreendedores e profissionais que desejam ampliar sua visão criativa, encontrar soluções inovadoras e humanizar o ambiente corporativo.",
      link: "/criatividade-empresarial"
    },
    {
      title: "Café Cultural",
      description: "Um espaço de diálogo e partilha de ideias sobre temas humanos, culturais e contemporâneos. Aberto ao público e com encontros regulares.",
      link: "/cafe-cultural"
    }
  ];

  return (
    <section id="cursos" className="py-20 px-4">
      <div className="container mx-auto">
        <h2 className="text-4xl md:text-5xl font-display font-bold text-center mb-4 text-foreground">
          Nossos Cursos e Programas
        </h2>
        <p className="text-center text-muted-foreground mb-12 text-lg max-w-2xl mx-auto">
          Descubra o programa ideal para sua jornada de desenvolvimento pessoal e profissional
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {courses.map((course, index) => (
            <div key={course.title} className="animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
              <CourseCard {...course} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Courses;
