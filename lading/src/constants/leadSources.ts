export type LeadSourceValue =
  | "indicacao"
  | "instagram"
  | "facebook"
  | "linkedin"
  | "evento"
  | "outro"
  | "redes-sociais"; // legacy value preservado para leads antigos

export interface LeadSourceOption {
  value: LeadSourceValue;
  label: string;
}

// Centraliza as opções para evitar strings hardcoded e permitir expansão futura.
export const leadSourceOptions: LeadSourceOption[] = [
  { value: "indicacao", label: "Indicação" },
  { value: "instagram", label: "Instagram" },
  { value: "facebook", label: "Facebook" },
  { value: "linkedin", label: "LinkedIn" },
  { value: "evento", label: "Evento" },
  { value: "outro", label: "Outro" },
];

const legacyOptions: Record<LeadSourceValue, string> = {
  "redes-sociais": "Redes sociais",
  indicacao: "Indicação",
  instagram: "Instagram",
  facebook: "Facebook",
  linkedin: "LinkedIn",
  evento: "Evento",
  outro: "Outro",
};

export const leadSourceLabel = (value?: string | null) => {
  if (!value) return "Não informado";
  const option = leadSourceOptions.find((opt) => opt.value === value);
  if (option) return option.label;
  return legacyOptions[value as LeadSourceValue] ?? value;
};
