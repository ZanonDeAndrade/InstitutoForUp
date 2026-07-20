import { useCallback, useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { courseApi } from "@/services/courseApi";
import { Course } from "@/types/course";
import { PILLARS, PillarId } from "@/constants/pillars";
import CourseCard from "./CourseCard";

interface LandingCourse {
  title: string;
  description: string;
  link: string;
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

const HIDDEN_COURSE_IDS = new Set(["criatividade-empresarial"]);

const extractSlugFromLink = (link: string) => {
  const segments = link.split("/").filter(Boolean);
  return segments[segments.length - 1] ?? link;
};

const Courses = () => {
  const [courses, setCourses] = useState<LandingCourse[]>([]);
  const [selectedPillar, setSelectedPillar] = useState<PillarId>(PILLARS[0].id);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const location = useLocation();

  const toLandingCourse = (course: Course): LandingCourse => ({
    title: course.name,
    description: course.description || "",
    link: `/curso/${course.id}`,
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
        setLoading(true);
        setLoadError(false);
        const remote = await courseApi.list();
        const visibleCourses = remote.filter(
          (course) =>
            !HIDDEN_COURSE_IDS.has(course.id) &&
            course.name?.toLowerCase() !== "criatividade empresarial",
        );
        setCourses(visibleCourses.map(toLandingCourse));
      } catch (error) {
        console.warn("Falha ao carregar cursos do backend.", error);
        setCourses([]);
        setLoadError(true);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  useEffect(() => {
    const hashPillar = PILLARS.find((pillar) => location.hash.includes(pillar.id));
    if (hashPillar && hashPillar.id !== selectedPillar) {
      setSelectedPillar(hashPillar.id);
    }
    // Only react to hash changes to avoid overriding manual tab changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.hash]);

  const filteredCourses = courses.filter((course) => getCoursePillar(course) === selectedPillar);
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

        {loading ? (
          <p className="text-center text-muted-foreground mt-8">Carregando cursos...</p>
        ) : loadError ? (
          <p className="text-center text-muted-foreground mt-8">
            Não foi possível carregar os cursos agora. Tente novamente em instantes.
          </p>
        ) : courses.length === 0 ? (
          <p className="text-center text-muted-foreground mt-8">
            Nenhum curso de formação cadastrado ainda.
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
              </div>
            </div>

            {filteredCourses.length === 0 ? (
              <p className="text-center text-muted-foreground mt-8">
                Nenhum curso cadastrado para {activePillar.label}.
              </p>
            ) : (
              <div className="max-w-7xl mx-auto">
                <h4 className="text-center text-lg font-semibold text-foreground mb-6">
                  Cursos disponíveis
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {filteredCourses.map((course, index) => (
                    <div
                      key={course.link}
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
