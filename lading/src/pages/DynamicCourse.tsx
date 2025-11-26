import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import CourseLayout from "@/components/CourseLayout";
import { Button } from "@/components/ui/button";
import CourseForm from "@/components/CourseForm";
import CourseImageCarousel from "@/components/CourseImageCarousel";
import WhatsAppButton from "@/components/WhatsAppButton";
import { courseApi } from "@/services/courseApi";
import { Course } from "@/types/course";

const COURSES_STORAGE_KEY = "forup_courses";
const fallbackFields = { name: true, email: true, phone: true, source: true };

const cafeCulturalConfig = {
  url: "https://chat.whatsapp.com/Cpxf7ujEIQZEck6REKrlP6",
  cta: "Entrar no grupo",
  short:
    "O Café Cultural é um grupo de estudos com encontros realizados mensalmente, dedicados a mergulhar na história da inteligência humana. Nosso objetivo é analisar e debater personalidades e assuntos que representam o auge da inovação e do conhecimento.",
  full:
    "O Café Cultural é um grupo de estudos com encontros realizados mensalmente, dedicados a mergulhar na história da inteligência humana. Nosso objetivo é analisar e debater personalidades e assuntos que representam o auge da inovação e do conhecimento.\n\nA cada ciclo, exploramos grandes mentes (como cientistas, filósofos e artistas) e temas que nos ajudam a entender o momento histórico e a capacidade de pensar da humanidade. O encontro é um momento de alegria e prazer, sem formalidades excessivas, onde se busca conhecer mais de forma prazerosa.\n\nO foco é no estudo detalhado, mas acessível, gerando aprendizados valiosos para a vida toda. As personalidades estudadas são analisadas através dos seguintes elementos: as formas de mentes, performances, habilidades, estilos de vida, culturas, educação, valores humanos e escolhas que as levaram a alcançar realizações de ponta. O principal é entender esses componentes de uma forma leve e informativa.\n\nO formato de nosso encontro mensal inclui o compartilhamento de material curado para estudo prévio, uma apresentação detalhada do tema e, no coração do evento, um debate cultural aberto e crítico. O Café Cultural é um espaço multidisciplinar que reúne pessoas de diversas áreas, unidas pela curiosidade, em um ambiente acolhedor e estimulante.",
};

const WHATSAPP_GROUPS: Record<string, typeof cafeCulturalConfig> = {
  "cafe-cultural": cafeCulturalConfig,
  "café cultural": cafeCulturalConfig,
  "cafe cultural": cafeCulturalConfig,
};

const normalizeKey = (course?: Pick<Course, "id" | "name">) => {
  const idKey = course?.id?.toLowerCase().trim();
  const nameKey = course?.name?.toLowerCase().trim();
  if (idKey && WHATSAPP_GROUPS[idKey]) return idKey;
  if (nameKey && WHATSAPP_GROUPS[nameKey]) return nameKey;
  return null;
};

const renderParagraphs = (text: string) => {
  return text.split(/\n\s*\n/).map((paragraph, idx) => (
    <p key={`${paragraph.slice(0, 20)}-${idx}`} className="text-lg md:text-xl text-muted-foreground leading-relaxed text-center">
      {paragraph}
    </p>
  ));
};

const DynamicCourse = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const [fallbackCourse, setFallbackCourse] = useState<Course | null>(null);

  const {
    data: remoteCourse,
    isPending,
  } = useQuery({
    queryKey: ["course", courseId],
    enabled: !!courseId,
    retry: 1,
    queryFn: () => courseApi.getById(courseId ?? ""),
  });

  useEffect(() => {
    try {
      const stored =
        typeof window !== "undefined" ? window.localStorage.getItem(COURSES_STORAGE_KEY) : null;
      const parsed: Course[] = stored ? JSON.parse(stored) : [];
      const found = parsed.find((item) => item.id === courseId);
      if (found) {
        setFallbackCourse(found);
      }
    } catch (error) {
      console.error("Erro ao carregar curso dinâmico", error);
    }
  }, [courseId]);

  const course = remoteCourse ?? fallbackCourse;
  const loading = isPending && !course;

  const whatsappKey = useMemo(() => normalizeKey(course ?? undefined), [course]);
  const whatsappConfig = whatsappKey ? WHATSAPP_GROUPS[whatsappKey] : null;
  const [showFullDesc, setShowFullDesc] = useState(false);

  useEffect(() => {
    setShowFullDesc(false);
  }, [whatsappKey]);

  useEffect(() => {
    if (course) {
      const fixedImages = course.images?.map((img) => ({
        ...img,
        url: img.url?.replace("/courses/courses/", "/courses/"),
      }));
      // eslint-disable-next-line no-console
      console.log("[dynamic-course] loaded", {
        id: course.id,
        images: fixedImages?.map((img) => img.url),
      });
    } else {
      console.log("[dynamic-course] no course found");
    }
  }, [course]);

  if (loading) {
    return (
      <CourseLayout>
        <div className="container mx-auto px-4 py-20">
          <p className="text-center text-muted-foreground">Carregando curso...</p>
        </div>
      </CourseLayout>
    );
  }

  if (!course) {
    return (
      <CourseLayout>
        <div className="container mx-auto px-4 py-20">
          <p className="text-center text-muted-foreground">Curso não encontrado.</p>
        </div>
      </CourseLayout>
    );
  }

  const descriptionContent = whatsappConfig
    ? showFullDesc
      ? whatsappConfig.full
      : whatsappConfig.short
    : course.description;

  return (
    <CourseLayout>
      <div className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12 animate-fade-in">
            <h1 className="text-4xl md:text-6xl font-display font-bold mb-6 text-gradient-gold">
              {course.name}
            </h1>
            <div className="w-24 h-1 bg-gradient-gold mx-auto mb-8" />
          </div>

          {course.images && course.images.length > 0 && (
            <div className="mb-10 animate-fade-in-delay">
              <CourseImageCarousel images={course.images} />
            </div>
          )}

          {descriptionContent && (
            <div className="bg-card rounded-2xl shadow-card p-8 md:p-12 mb-12 animate-fade-in-delay space-y-4">
              {renderParagraphs(descriptionContent)}
              {whatsappConfig && (
                <div className="mt-2 text-center">
                  <button
                    type="button"
                    className="text-sm font-semibold text-primary hover:text-primary/80 underline"
                    onClick={() => setShowFullDesc((prev) => !prev)}
                  >
                    {showFullDesc ? "Ver menos" : "Ver mais"}
                  </button>
                </div>
              )}
            </div>
          )}

          {whatsappConfig ? (
            <div className="flex flex-col items-center gap-3 mb-10 animate-fade-in">
              <Button
                asChild
                variant="hero"
                size="lg"
                className="text-lg px-10 py-6 h-auto"
              >
                <a href={whatsappConfig.url} target="_blank" rel="noopener noreferrer">
                  {whatsappConfig.cta || "Tenho interesse"}
                </a>
              </Button>
              <p className="text-sm text-muted-foreground">Ao clicar, você será redirecionado para o grupo.</p>
            </div>
          ) : (
            <>
              <div className="flex justify-center mb-10 animate-fade-in">
                <WhatsAppButton courseName={course.name} variant="hero" label="Falar no WhatsApp" />
              </div>

              <div className="animate-slide-up">
                <CourseForm courseName={course.name} fields={course.fields ?? fallbackFields} />
              </div>
            </>
          )}
        </div>
      </div>
    </CourseLayout>
  );
};

export default DynamicCourse;
