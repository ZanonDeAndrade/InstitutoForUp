import type { Course } from "@/types/course";
import type { CourseContent, CourseSection } from "@/types/courseContent";

const defaultFields = { name: true, email: true, phone: true, source: true };
const bulletPattern = /^[•●○]/;

const headingsByCourse: Record<string, Set<string>> = {
  "valores-humanos": new Set(["Propósito do Programa", "Metodologia de Desenvolvimento e Alta Performance", "A Quem se Destina"]),
  "desenvolvimento-jovem-lider": new Set(["Os Alicerces da Liderança de Destaque", "Estrutura para o Sucesso Consistente", "A Quem se Destina"]),
  "performando-lideranca-resultado": new Set(["Objetivo: Potencialização e Maestria", "O Resgate do Mestre Interior", "Estrutura e Dinâmica de Alto Nível"]),
  "jornada-lideristica": new Set(["Por que a Jornada Liderística?", "Propósito e Temáticas", "Metodologia e Coordenação", "Datas e Locais"]),
};

const legacyQuotes: Record<string, string> = {
  "valores-humanos": "“O resultado tangível, depende dos valores intangíveis.” (U.M.)",
  "performando-lideranca-resultado": "“Alcançar uma posição de destaque, de liderança não é difícil. O desafio é realizar a evolução contínua e in progress.”",
};

const cafeContent = {
  url: "https://chat.whatsapp.com/Cpxf7ujEIQZEck6REKrlP6",
  short:
    "O Café Cultural é um grupo de estudos com encontros realizados mensalmente, dedicados a mergulhar na história da inteligência humana. Nosso objetivo é analisar e debater personalidades e assuntos que representam o auge da inovação e do conhecimento.",
  full:
    "O Café Cultural é um grupo de estudos com encontros realizados mensalmente, dedicados a mergulhar na história da inteligência humana. Nosso objetivo é analisar e debater personalidades e assuntos que representam o auge da inovação e do conhecimento.\n\nA cada ciclo, exploramos grandes mentes (como cientistas, filósofos e artistas) e temas que nos ajudam a entender o momento histórico e a capacidade de pensar da humanidade. O encontro é um momento de alegria e prazer, sem formalidades excessivas, onde se busca conhecer mais de forma prazerosa.\n\nO foco é no estudo detalhado, mas acessível, gerando aprendizados valiosos para a vida toda. As personalidades estudadas são analisadas através dos seguintes elementos: as formas de mentes, performances, habilidades, estilos de vida, culturas, educação, valores humanos e escolhas que as levaram a alcançar realizações de ponta. O principal é entender esses componentes de uma forma leve e informativa.\n\nO formato de nosso encontro mensal inclui o compartilhamento de material curado para estudo prévio, uma apresentação detalhada do tema e, no coração do evento, um debate cultural aberto e crítico. O Café Cultural é um espaço multidisciplinar que reúne pessoas de diversas áreas, unidas pela curiosidade, em um ambiente acolhedor e estimulante.",
};

const cleanLine = (line: string) => line.replace(/^[\s\-•●○]+/, "").replace(/\s+/g, " ").trim();

export const legacyDescriptionToSections = (description: string, headings = new Set<string>()): CourseSection[] =>
  description
    .split(/\n\s*\n/)
    .map((block, index): CourseSection | null => {
      const lines = block.split("\n").map((line) => line.trim()).filter(Boolean);
      if (!lines.length) return null;
      const heading = headings.has(lines[0] ?? "") ? lines[0] : undefined;
      const contentLines = heading ? lines.slice(1) : lines;
      const allBullets = lines.every((line) => bulletPattern.test(line));
      const bullets = heading
        ? contentLines.filter((line) => bulletPattern.test(line)).map(cleanLine)
        : allBullets
          ? lines.map(cleanLine)
          : [];
      const paragraphs = heading
        ? contentLines.filter((line) => !bulletPattern.test(line)).map(cleanLine)
        : allBullets
          ? []
          : lines.map(cleanLine);
      return {
        id: `legacy-${index + 1}`,
        type: "text",
        heading,
        paragraphs,
        ...(bullets.length ? { bullets } : {}),
        align: heading ? "left" : "center",
      };
    })
    .filter((section): section is CourseSection => section !== null);

const isCafeCultural = (course: Course) => {
  const id = course.id.toLowerCase().trim();
  const name = course.name.toLowerCase().trim();
  return id === "cafe-cultural" || name === "café cultural" || name === "cafe cultural";
};

const legacyCourseKey = (course: Course) => {
  const id = course.id.toLowerCase();
  const name = course.name.toLowerCase();
  if (id === "valores-humanos" || name.includes("valores humanos")) return "valores-humanos";
  if (id === "desenvolvimento-jovem-lider" || name.includes("jovem líder")) return "desenvolvimento-jovem-lider";
  if (id === "performando-lideranca-resultado" || name.includes("performando liderança e resultado")) return "performando-lideranca-resultado";
  if (id === "jornada-lideristica" || name.includes("jornada liderística")) return "jornada-lideristica";
  return id;
};

export const buildLegacyCourseContent = (course: Course): CourseContent => {
  const fields = course.fields as (typeof defaultFields & { quote?: string }) | undefined;
  const courseKey = legacyCourseKey(course);
  if (isCafeCultural(course)) {
    return {
      version: 1,
      seo: { title: course.name, description: cafeContent.short },
      sections: legacyDescriptionToSections(cafeContent.full),
      cta: {
        type: "external",
        label: "Entrar no grupo",
        url: cafeContent.url,
        helperText: "Ao clicar, você será redirecionado para o grupo.",
        collapsedSections: legacyDescriptionToSections(cafeContent.short),
      },
      form: { fields: course.fields ?? defaultFields },
    };
  }

  return {
    version: 1,
    seo: { title: course.name, description: course.description?.slice(0, 300) },
    hero: { quote: fields?.quote ?? legacyQuotes[courseKey] },
    sections: course.description ? legacyDescriptionToSections(course.description, headingsByCourse[courseKey]) : [],
    cta: { type: "form" },
    form: { fields: course.fields ?? defaultFields },
  };
};
