import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { courseApi } from "@/services/courseApi";
import { Course } from "@/types/course";
import CourseCard from "./CourseCard";

interface LandingCourse {
  title: string;
  description: string;
  link: string;
  imageUrl?: string;
}

const YEARS = [2025, 2026] as const;
type Year = (typeof YEARS)[number];

const FRIENDLY_COURSE_ROUTES: Record<string, string> = {
  "criterios-valores": "/criterios-valores",
  "performando-liderancas": "/performando-liderancas",
  "jovens-lideres": "/jovens-lideres",
  "desenvolvimento-jovem-lider": "/curso/desenvolvimento-jovem-lider",
  "performando-lideranca-resultado": "/curso/performando-lideranca-resultado",
  "jornada-lideristica": "/curso/jornada-lideristica",
  "valores-humanos": "/curso/valores-humanos",
  "cafe-cultural": "/cafe-cultural",
};

const FALLBACK_COURSES: LandingCourse[] = [
  {
    title: "Desenvolvimento do Jovem Líder (DJL)",
    description:
      "Construa a base de liderança com valores humanos, disciplina e mentalidade estratégica. Programa estruturado em ciclos com aulas ao vivo e imersões presenciais para jovens que querem protagonizar sua carreira.",
    link: "/curso/desenvolvimento-jovem-lider",
  },
  {
    title: "Valores Humanos: Base para a Autorrealização (VH)",
    description:
      "Construa uma fundação sólida em valores universais para performar liderança, resultado e criatividade com propósito.",
    link: "/curso/valores-humanos",
  },
  {
    title: "Performando Liderança e Resultado (PLR)",
    description:
      "Imersão para líderes que buscam maestria em resultado, gestão e pessoas. Aulas ao vivo, imersões presenciais e consultoria estratégica para evolução contínua.",
    link: "/curso/performando-lideranca-resultado",
  },
  {
    title: "Jornada Liderística: Critério Organísmico, Intuição e Racionalidade",
    description:
      "Prática diária para decisões e escolhas ótimas, unindo critério organísmico, racionalidade e intuição, com aulas dialogadas, dinâmicas e imersão.",
    link: "/curso/jornada-lideristica",
  },
  {
    title: "Café Cultural",
    description:
      "Programa aberto e gratuito para elevar humanismo, autoestima e dignidade, com encontros mensais de reflexão sobre valores humanos e inspiração em grandes pensadores.",
    link: "/cafe-cultural",
  },
];

const Courses = () => {
  const [courses, setCourses] = useState<LandingCourse[]>([]);
  const [selectedYear, setSelectedYear] = useState<Year>(2025);
  const location = useLocation();

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
        const filtered = remote.filter(
          (course) =>
            course.id !== "criatividade-empresarial" &&
            course.name?.toLowerCase() !== "criatividade empresarial",
        );
        const merged = mergeWithFallback(filtered.map(toLandingCourse));
        setCourses(merged);
      } catch (error) {
        console.warn("Falha ao carregar cursos do backend.", error);
        setCourses(mergeWithFallback([]));
      }
    };
    load();
  }, []);

  useEffect(() => {
    const hashYear = YEARS.find((year) => location.hash.includes(year.toString()));
    if (hashYear && hashYear !== selectedYear) {
      setSelectedYear(hashYear);
    }
  }, [location.hash, selectedYear]);

  const mergeWithFallback = (remote: LandingCourse[]) => {
    const map = new Map<string, LandingCourse>();
    FALLBACK_COURSES.forEach((course) => map.set(course.link, course));
    remote.forEach((course) => map.set(course.link, course));
    return Array.from(map.values());
  };

  const isJornadaCourse = (course: LandingCourse) => course.link.includes("jornada-lideristica");
  const getCourseYear = (course: LandingCourse): Year => (isJornadaCourse(course) ? 2025 : 2026);
  const filteredCourses = courses.filter((course) => getCourseYear(course) === selectedYear);

  return (
    <section id="cursos" className="relative py-20 px-4">
      {YEARS.map((year) => (
        <span
          key={year}
          id={`cursos-${year}`}
          className="absolute -top-24 h-px w-px opacity-0"
          aria-hidden="true"
        />
      ))}
      <div className="container mx-auto">
        <h2 className="text-4xl md:text-5xl font-display font-bold text-center mb-4 text-foreground">
          Nossa Programação
        </h2>
        <p className="text-center text-muted-foreground mb-12 text-lg max-w-2xl mx-auto">
          Descubra o programa ideal para sua jornada de desenvolvimento pessoal e profissional
        </p>

        {courses.length === 0 ? (
          <p className="text-center text-muted-foreground mt-8">
            Nenhum projeto de formação cadastrado ainda. Volte em breve.
          </p>
        ) : (
          <>
            <div className="flex items-center justify-center gap-4 mb-10">
              {YEARS.map((year) => {
                const isActive = selectedYear === year;
                return (
                  <Button
                    key={year}
                    variant="outline"
                    className={`rounded-full text-lg px-6 py-3 border-2 transition-all ${
                      isActive
                        ? "bg-gradient-gold text-primary-foreground border-transparent shadow-gold hover:scale-105"
                        : "bg-background/70 border-border text-foreground hover:-translate-y-0.5"
                    }`}
                    onClick={() => setSelectedYear(year)}
                  >
                    {year}
                  </Button>
                );
              })}
            </div>

            {filteredCourses.length === 0 ? (
              <p className="text-center text-muted-foreground mt-8">
                Nenhum curso programado para {selectedYear} no momento.
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
                {filteredCourses.map((course, index) => (
                  <div
                    key={course.title}
                    className="animate-fade-in"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <CourseCard {...course} />
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
};

export default Courses;
