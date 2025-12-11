export interface Pillar {
  id: string;
  label: string;
  description: string;
  courseSlugs: string[];
}

export const PILLARS = [
  {
    id: "valores-humanos",
    label: "Valores Humanos",
    description:
      "Uma educação voltada ao resgate e desenvolvimento dos valores humanos, de modo prático e vivencial; a base para ter pessoas de alta performance empresarial.",
    courseSlugs: ["valores-humanos", "cafe-cultural", "criterios-valores"],
  },
  {
    id: "lideranca-resultado",
    label: "Liderança e Resultado",
    description:
      "O sucesso de uma empresa depende de seus líderes com forte propósito uno ao projeto da empresa. Performar a capacidade dos líderes passa pelos pontos recônditos — esfera pessoal, estilo de vida, diplomacia, relacionamento — e pela compreensão da dinâmica da rede de informações subjacentes.",
    courseSlugs: [
      "desenvolvimento-jovem-lider",
      "performando-lideranca-resultado",
      "performando-liderancas",
      "jovens-lideres",
      "jornada-lideristica",
    ],
  },
  {
    id: "criatividade-empresarial",
    label: "Criatividade Empresarial",
    description:
      "A criatividade é a ponta diáfana da nossa evolução inteligente: novidade de ação e de vida que emerge do próprio sujeito. Ela floresce quando há uma personalidade altamente performada no seu core business, com propósito de vida e habilidades maduramente desenvolvidas.",
    courseSlugs: ["criatividade-empresarial"],
  },
] as const satisfies readonly Pillar[];

export type PillarId = (typeof PILLARS)[number]["id"];
