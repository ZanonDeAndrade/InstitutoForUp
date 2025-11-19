import { useEffect, useState } from "react";
import CourseCard from "./CourseCard";

interface LandingCourse {
  title: string;
  description: string;
  link: string;
}

const COURSES_STORAGE_KEY = "forup_courses";

const Courses = () => {
  const staticCourses: LandingCourse[] = [
    {
      title: "Critérios e Valores Humanos",
      description:
        "Um programa que busca resgatar a essência dos valores que guiam a ação humana e sustentam decisões éticas e conscientes. Ideal para quem deseja alinhar propósito e resultados.",
      link: "/criterios-valores",
    },
    {
      title: "Performando Lideranças",
      description:
        "Desenvolva as competências essenciais para liderar pessoas e projetos com autenticidade, clareza e impacto. Um percurso prático para quem quer transformar potencial em realização.",
      link: "/performando-liderancas",
    },
    {
      title: "Jovens Líderes",
      description:
        "Voltado a jovens que desejam descobrir seu papel no mundo e desenvolver liderança com base em valores humanos e responsabilidade social.",
      link: "/jovens-lideres",
    },
    {
      title: "Criatividade Empresarial",
      description:
        "Programa voltado a empreendedores e profissionais que desejam ampliar sua visão criativa, encontrar soluções inovadoras e humanizar o ambiente corporativo.",
      link: "/criatividade-empresarial",
    },
    {
      title: "Café Cultural",
      description:
        "Um espaço de diálogo e partilha de ideias sobre temas humanos, culturais e contemporâneos. Aberto ao público e com encontros regulares.",
      link: "/cafe-cultural",
    },
  ];

  const [courses, setCourses] = useState<LandingCourse[]>(staticCourses);

  useEffect(() => {
    try {
      const stored =
        typeof window !== "undefined" ? window.localStorage.getItem(COURSES_STORAGE_KEY) : null;
      if (!stored) return;

      const parsed: Array<{ id: string; name: string; description?: string }> = JSON.parse(stored);

      const staticWithOverrides: LandingCourse[] = staticCourses.map((course) => {
        const idFromLink = course.link.startsWith("/") ? course.link.slice(1) : course.link;
        const storedCourse = parsed.find((item) => item.id === idFromLink);
        if (!storedCourse) return course;

        return {
          ...course,
          title: storedCourse.name || course.title,
          description: storedCourse.description ?? course.description,
        };
      });

      const additional: LandingCourse[] = parsed
        .filter((storedCourse) => {
          const isStatic = staticCourses.some((course) => {
            const idFromLink = course.link.startsWith("/") ? course.link.slice(1) : course.link;
            return idFromLink === storedCourse.id;
          });
          return storedCourse.name && !isStatic;
        })
        .map((storedCourse) => ({
          title: storedCourse.name,
          description: storedCourse.description || "",
          link: `/curso/${storedCourse.id}`,
        }));

      setCourses([...staticWithOverrides, ...additional]);
    } catch (error) {
      console.error("Erro ao carregar cursos cadastrados", error);
    }
  }, []);

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
