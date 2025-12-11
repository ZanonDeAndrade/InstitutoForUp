import { useCallback, useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { courseApi } from "@/services/courseApi";
import { Course } from "@/types/course";
import { PILLARS, PillarId } from "@/constants/pillars";
import CourseCard from "./CourseCard";

const PROGRAM_YEARS = [2025, 2026] as const;
type ProgramYear = (typeof PROGRAM_YEARS)[number];
const DEFAULT_PROGRAM_YEAR: ProgramYear = PROGRAM_YEARS[PROGRAM_YEARS.length - 1];

interface LandingCourse {
  title: string;
  description: string;
  link: string;
  years: ProgramYear[];
  pillarId?: PillarId;
  imageUrl?: string;
}

const COURSE_PILLAR_MAP: Record<string, PillarId> = PILLARS.reduce(
  (map, pillar) => {
    pillar.courseSlugs.forEach((slug) => {
      map[slug] = pillar.id;
    });
    return map;
  },
  {} as Record<string, PillarId>,
);

const COURSE_YEAR_OVERRIDES: Record<string, ProgramYear[]> = {
  "jornada-lideristica": [2025],
};

const resolveCourseYears = (years?: number[], slug?: string): ProgramYear[] => {
  if (slug && COURSE_YEAR_OVERRIDES[slug]) {
    return COURSE_YEAR_OVERRIDES[slug];
  }
  const validYears = Array.isArray(years)
    ? years.filter((year): year is ProgramYear => PROGRAM_YEARS.includes(year as ProgramYear))
    : [];
  return validYears.length > 0 ? validYears : [DEFAULT_PROGRAM_YEAR];
};

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
    years: [2026],
  },
  {
    title: "Valores Humanos: Base para a Autorrealização (VH)",
    description:
      "Construa uma fundação sólida em valores universais para performar liderança, resultado e criatividade com propósito.",
    link: "/curso/valores-humanos",
    years: [2026],
  },
  {
    title: "Performando Liderança e Resultado (PLR)",
    description:
      "Imersão para líderes que buscam maestria em resultado, gestão e pessoas. Aulas ao vivo, imersões presenciais e consultoria estratégica para evolução contínua.",
    link: "/curso/performando-lideranca-resultado",
    years: [2026],
  },
  {
    title: "Jornada Liderística: Critério Organísmico, Intuição e Racionalidade",
    description:
      "Prática diária para decisões e escolhas ótimas, unindo critério organísmico, racionalidade e intuição, com aulas dialogadas, dinâmicas e imersão.",
    link: "/curso/jornada-lideristica",
    years: [2025],
  },
  {
    title: "Café Cultural",
    description:
      "Programa aberto e gratuito para elevar humanismo, autoestima e dignidade, com encontros mensais de reflexão sobre valores humanos e inspiração em grandes pensadores.",
    link: "/cafe-cultural",
    years: [2026],
  },
];

const extractSlugFromLink = (link: string) => {
  const segments = link.split("/").filter(Boolean);
  return segments[segments.length - 1] ?? link;
};

const Courses = () => {
  const [courses, setCourses] = useState<LandingCourse[]>([]);
  const [selectedPillar, setSelectedPillar] = useState<PillarId>(PILLARS[0].id);
  const [selectedYear, setSelectedYear] = useState<ProgramYear>(PROGRAM_YEARS[0]);
  const [hasInteractedWithYear, setHasInteractedWithYear] = useState(false);
  const location = useLocation();

  const toLandingCourse = (course: Course): LandingCourse => ({
    title: course.name,
    description: course.description || "",
    link: FRIENDLY_COURSE_ROUTES[course.id] ?? `/curso/${course.id}`,
    years: resolveCourseYears(course.years, course.id),
    pillarId: course.pillar as PillarId | undefined,
    imageUrl: course.images?.[0]?.url,
  });

  const getCoursePillar = useCallback((course: LandingCourse): PillarId => {
    if (course.pillarId && PILLARS.some((pillar) => pillar.id === course.pillarId)) {
      return course.pillarId;
    }
    const slug = extractSlugFromLink(course.link);
    return COURSE_PILLAR_MAP[slug] ?? PILLARS[0].id;
  }, []);

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
    const hashPillar = PILLARS.find((pillar) => location.hash.includes(pillar.id));
    if (hashPillar && hashPillar.id !== selectedPillar) {
      setSelectedPillar(hashPillar.id);
    }
  }, [location.hash, selectedPillar]);

  useEffect(() => {
    const hasCoursesForSelectedYear = courses.some(
      (course) =>
        getCoursePillar(course) === selectedPillar && course.years.includes(selectedYear),
    );
    if (!hasCoursesForSelectedYear && !hasInteractedWithYear) {
      const fallbackYear = PROGRAM_YEARS.find((year) =>
        courses.some(
          (course) => getCoursePillar(course) === selectedPillar && course.years.includes(year),
        ),
      );
      if (fallbackYear) {
        setSelectedYear(fallbackYear);
      }
    }
  }, [courses, getCoursePillar, hasInteractedWithYear, selectedPillar, selectedYear]);

  const mergeWithFallback = (remote: LandingCourse[]) => {
    const map = new Map<string, LandingCourse>();
    FALLBACK_COURSES.forEach((course) => map.set(course.link, course));
    remote.forEach((course) => map.set(course.link, course));
    return Array.from(map.values());
  };

  const filteredCourses = courses.filter(
    (course) =>
      getCoursePillar(course) === selectedPillar && course.years.includes(selectedYear),
  );
  const activePillar = PILLARS.find((pillar) => pillar.id === selectedPillar) ?? PILLARS[0];

  return (
    <section id="cursos" className="relative py-20 px-4">
      {PILLARS.map((pillar) => (
        <span
          key={pillar.id}
          id={`pilar-${pillar.id}`}
          className="absolute -top-24 h-px w-px opacity-0"
          aria-hidden="true"
        />
      ))}
      <div className="container mx-auto">
        <h2 className="text-4xl md:text-5xl font-display font-bold text-center mb-4 text-foreground">
          Pilares da Formação
        </h2>
        <p className="text-center text-muted-foreground mb-12 text-lg max-w-2xl mx-auto">
          Escolha um pilar para ver a apresentação e os cursos correspondentes.
        </p>

        {courses.length === 0 ? (
          <p className="text-center text-muted-foreground mt-8">
            Nenhum curso de formação cadastrado ainda. Volte em breve.
          </p>
        ) : (
          <>
            <div className="flex flex-wrap items-center justify-center gap-4 mb-10">
              {PILLARS.map((pillar) => {
                const isActive = selectedPillar === pillar.id;
                return (
                  <Button
                    key={pillar.id}
                    variant="outline"
                    className={`rounded-full text-lg px-6 py-3 border-2 transition-all ${
                      isActive
                        ? "bg-gradient-gold text-primary-foreground border-transparent shadow-gold hover:scale-105"
                        : "bg-background/70 border-border text-foreground hover:-translate-y-0.5"
                    }`}
                    onClick={() => setSelectedPillar(pillar.id)}
                  >
                    {pillar.label}
                  </Button>
                );
              })}
            </div>

            <div className="max-w-4xl mx-auto mb-10">
              <div className="bg-background/70 border border-border rounded-2xl p-6 shadow-lg text-center space-y-4">
                <h3 className="text-2xl font-semibold text-foreground">
                  {activePillar.label}
                </h3>
                <p className="text-muted-foreground leading-relaxed">{activePillar.description}</p>
                <div className="pt-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground mb-3">
                    Programações por ano
                  </p>
                  <div className="flex flex-wrap items-center justify-center gap-3">
                    {PROGRAM_YEARS.map((year) => {
                      const isActive = selectedYear === year;
                      return (
                        <Button
                          key={year}
                          variant="outline"
                          className={`rounded-full text-base px-5 py-2 border-2 transition-all ${
                            isActive
                              ? "bg-gradient-gold text-primary-foreground border-transparent shadow-gold hover:scale-105"
                              : "bg-background/70 border-border text-foreground hover:-translate-y-0.5"
                          }`}
                          onClick={() => {
                            setHasInteractedWithYear(true);
                            setSelectedYear(year);
                          }}
                        >
                          {year}
                        </Button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {filteredCourses.length === 0 ? (
              <p className="text-center text-muted-foreground mt-8">
                {activePillar.id === "valores-humanos" && selectedYear === 2025
                  ? "Não há formação programada para 2025 neste pilar. Selecione 2026 para ver as turmas."
                  : `Nenhum curso listado para ${activePillar.label} em ${selectedYear}.`}
              </p>
            ) : (
              <div className="max-w-7xl mx-auto">
                <h4 className="text-center text-lg font-semibold text-foreground mb-6">
                  Programação {selectedYear}
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
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
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
};

export default Courses;
