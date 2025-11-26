import { useEffect, useState } from "react";
import { courseApi } from "@/services/courseApi";
import { Course } from "@/types/course";
import CourseCard from "./CourseCard";

interface LandingCourse {
  title: string;
  description: string;
  link: string;
  imageUrl?: string;
}

const FRIENDLY_COURSE_ROUTES: Record<string, string> = {
  "criterios-valores": "/criterios-valores",
  "performando-liderancas": "/performando-liderancas",
  "jovens-lideres": "/jovens-lideres",
  "criatividade-empresarial": "/criatividade-empresarial",
  "cafe-cultural": "/cafe-cultural",
};

const Courses = () => {
  const [courses, setCourses] = useState<LandingCourse[]>([]);

  const toLandingCourse = (course: Course): LandingCourse => ({
    title: course.name,
    description: course.description || "",
    link: FRIENDLY_COURSE_ROUTES[course.id] ?? `/curso/${course.id}`,
    imageUrl: course.images?.[0]?.url,
  });

  useEffect(() => {
    const load = async () => {
      try {
        const remote = await courseApi.list();
        setCourses(remote.map(toLandingCourse));
      } catch (error) {
        console.warn("Falha ao carregar cursos do backend.", error);
        setCourses([]);
      }
    };
    load();
  }, []);

  return (
    <section id="cursos" className="py-20 px-4">
      <div className="container mx-auto">
        <h2 className="text-4xl md:text-5xl font-display font-bold text-center mb-4 text-foreground">
          Nossos Projetos de Formação
        </h2>
        <p className="text-center text-muted-foreground mb-12 text-lg max-w-2xl mx-auto">
          Descubra o programa ideal para sua jornada de desenvolvimento pessoal e profissional
        </p>

        {courses.length === 0 ? (
          <p className="text-center text-muted-foreground mt-8">
            Nenhum projeto de formação cadastrado ainda. Volte em breve.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {courses.map((course, index) => (
              <div key={course.title} className="animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
                <CourseCard {...course} />
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default Courses;
