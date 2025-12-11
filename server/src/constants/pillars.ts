export const PILLAR_IDS = [
  "valores-humanos",
  "lideranca-resultado",
  "criatividade-empresarial",
] as const;

export type PillarId = (typeof PILLAR_IDS)[number];

export const PILLAR_BY_COURSE: Record<string, PillarId> = {
  "valores-humanos": "valores-humanos",
  "cafe-cultural": "valores-humanos",
  "criterios-valores": "valores-humanos",
  "desenvolvimento-jovem-lider": "lideranca-resultado",
  "performando-lideranca-resultado": "lideranca-resultado",
  "performando-liderancas": "lideranca-resultado",
  "jovens-lideres": "lideranca-resultado",
  "jornada-lideristica": "lideranca-resultado",
  "criatividade-empresarial": "criatividade-empresarial",
};
