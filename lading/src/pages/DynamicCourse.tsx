import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import CourseLayout from "@/components/CourseLayout";
import { Button } from "@/components/ui/button";
import CourseForm from "@/components/CourseForm";
import CourseImageCarousel from "@/components/CourseImageCarousel";
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

const VH_HEADINGS = new Set([
  "Propósito do Programa",
  "Metodologia de Desenvolvimento e Alta Performance",
  "A Quem se Destina",
]);
const DJL_HEADINGS = new Set([
  "Os Alicerces da Liderança de Destaque",
  "Estrutura para o Sucesso Consistente",
  "A Quem se Destina",
]);
const PLR_HEADINGS = new Set([
  "Objetivo: Potencialização e Maestria",
  "O Resgate do Mestre Interior",
  "Estrutura e Dinâmica de Alto Nível",
]);
const JL_HEADINGS = new Set([
  "Por que a Jornada Liderística?",
  "Propósito e Temáticas",
  "Metodologia e Coordenação",
  "Datas e Locais",
]);

const renderParagraphs = (text: string, options?: { headingSet?: Set<string>; isValoresHumanos?: boolean }) => {
  const bulletRegex = /^[•●○]/;
  const cleanLine = (line: string) => line.replace(/^[\s\-•●○]+/, "");
  const normalizeText = (line: string) => line.replace(/\s+/g, " ").trim();
  const headingSet = options?.headingSet;
  const blocks = text.split(/\n\s*\n/);

  return blocks.map((block, idx) => {
    const lines = block
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

    const firstLine = lines[0] ?? "";
    const rest = lines.slice(1);
    const allBullets = lines.every((line) => bulletRegex.test(line));
    const isHeadingBlock = headingSet?.has(firstLine) ?? false;

    // Lista simples apenas quando o bloco é todo de bullets explícitos
    if (allBullets) {
      return (
        <ul
          key={`block-${idx}`}
          className="text-lg md:text-xl text-muted-foreground leading-relaxed text-left text-justify space-y-2 list-disc list-inside"
        >
          {lines.map((line, liIndex) => (
            <li key={`vh-li-${idx}-${liIndex}`}>{normalizeText(line.replace(/^[•●○]\s*/, ""))}</li>
          ))}
        </ul>
      );
    }

    // Blocos com título + conteúdo
    if (isHeadingBlock) {
      const bulletLines = rest.filter((line) => bulletRegex.test(line));
      const otherLines = rest.filter((line) => !bulletRegex.test(line));

      return (
        <div key={`block-${idx}`} className="space-y-3 text-left">
          <p className="text-lg md:text-xl text-foreground font-semibold leading-relaxed text-justify">
            {firstLine}
          </p>
          {otherLines.map((line, liIndex) => (
            <p
              key={`vh-heading-p-${idx}-${liIndex}`}
              className="text-lg md:text-xl text-muted-foreground leading-relaxed text-justify whitespace-pre-line"
            >
            {normalizeText(cleanLine(line))}
            </p>
          ))}
          {!!bulletLines.length && (
            <ul className="text-lg md:text-xl text-muted-foreground leading-relaxed text-justify space-y-2 list-disc list-inside">
              {bulletLines.map((line, liIndex) => (
                <li key={`vh-heading-li-${idx}-${liIndex}`}>{normalizeText(line.replace(/^[•●○]\s*/, ""))}</li>
              ))}
            </ul>
          )}
        </div>
      );
    }

    // Fallback padrão
    return lines.map((line, lineIdx) => (
      <p
        key={`block-${idx}-line-${lineIdx}`}
        className="text-lg md:text-xl text-muted-foreground leading-relaxed text-center text-justify whitespace-pre-line"
      >
        {normalizeText(cleanLine(line))}
      </p>
    ));
  });
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
  const isValoresHumanos =
    (course?.id?.toLowerCase() ?? "") === "valores-humanos" ||
    (course?.name?.toLowerCase() ?? "").includes("valores humanos");
  const isJovemLider =
    (course?.id?.toLowerCase() ?? "") === "desenvolvimento-jovem-lider" ||
    (course?.name?.toLowerCase() ?? "").includes("jovem líder");
  const isPlr =
    (course?.id?.toLowerCase() ?? "") === "performando-lideranca-resultado" ||
    (course?.name?.toLowerCase() ?? "").includes("performando liderança e resultado");
  const isJornadaLideristica =
    (course?.id?.toLowerCase() ?? "") === "jornada-lideristica" ||
    (course?.name?.toLowerCase() ?? "").includes("jornada liderística");
  const headingSet = isValoresHumanos
    ? VH_HEADINGS
    : isJovemLider
      ? DJL_HEADINGS
      : isPlr
        ? PLR_HEADINGS
        : isJornadaLideristica
          ? JL_HEADINGS
          : undefined;
  const quoteFromFields = typeof (course?.fields as Record<string, unknown> | undefined)?.quote === "string"
    ? String((course?.fields as Record<string, unknown> | undefined)?.quote)
    : null;
  const highlightQuote =
    quoteFromFields ||
    (isValoresHumanos
      ? "“O resultado tangível, depende dos valores intangíveis.” (U.M.)"
      : isPlr
        ? "“Alcançar uma posição de destaque, de liderança não é difícil. O desafio é realizar a evolução contínua e in progress.”"
        : null);

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
            {highlightQuote && (
              <div className="mt-6 bg-secondary/40 border border-border/60 rounded-2xl px-6 py-4 inline-block shadow-card">
                <p className="text-lg md:text-xl text-muted-foreground italic">{highlightQuote}</p>
              </div>
            )}
          </div>

          {course.images && course.images.length > 0 && (
            <div className="mb-10 animate-fade-in-delay">
              <CourseImageCarousel images={course.images} />
            </div>
          )}

          {descriptionContent && (
            <div className="bg-card rounded-2xl shadow-card p-8 md:p-12 mb-12 animate-fade-in-delay space-y-4">
              {renderParagraphs(descriptionContent, { headingSet, isValoresHumanos })}
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
              <div className="animate-slide-up mt-10">
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
