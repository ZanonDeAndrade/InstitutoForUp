import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import WhatsAppButton from "@/components/WhatsAppButton";
import TurnstileCaptcha from "@/components/TurnstileCaptcha";
import { leadSourceOptions } from "@/constants/leadSources";
import { leadApi } from "@/services/leadApi";
import type { CourseFieldsConfig } from "@/types/course";
import type { LeadInterestFormValues } from "@/types/lead";

interface CourseFormProps {
  courseId: string;
  courseName: string;
  fields?: CourseFieldsConfig;
}

const CourseForm = ({ courseId, courseName, fields }: CourseFormProps) => {
  const effectiveFields: CourseFieldsConfig = fields ?? {
    name: true,
    email: true,
    phone: true,
    source: true,
  };

  type FormField = "name" | "email" | "phone" | "source" | "message" | "website";

  const [formData, setFormData] = useState<LeadInterestFormValues>({
    name: "",
    email: "",
    phone: "",
    source: "",
    message: "",
    website: "",
  });
  const [formStartedAt, setFormStartedAt] = useState(() => Date.now());
  const [captchaToken, setCaptchaToken] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const captchaSiteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY?.trim();

  const resetProtectionFields = () => {
    setFormStartedAt(Date.now());
    setCaptchaToken("");
  };

  const updateField = (field: FormField, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setSubmitted(false);
  };

  const updateCaptchaToken = useCallback((token: string) => {
    setCaptchaToken(token);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const missingRequired =
      (effectiveFields.name && !formData.name) ||
      (effectiveFields.email && !formData.email) ||
      (effectiveFields.phone && !formData.phone) ||
      (effectiveFields.source && !formData.source);

    if (missingRequired) {
      toast.error("Por favor, preencha todos os campos obrigatórios");
      return;
    }

    if (formData.message && formData.message.length > 500) {
      toast.error("A mensagem pode ter no máximo 500 caracteres.");
      return;
    }

    setSubmitted(false);
    if (captchaSiteKey && !captchaToken) {
      toast.error("Conclua a verificaÃ§Ã£o anti-abuso antes de enviar.");
      return;
    }

    setSubmitting(true);
    try {
      const idempotencyKey = crypto.randomUUID();
      await leadApi.create({
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim() || undefined,
        source: formData.source || undefined,
        message: formData.message?.trim() || undefined,
        course: courseName,
        courseId,
        website: formData.website,
        formStartedAt,
        captchaToken: captchaToken || "captcha-disabled-on-client",
        idempotencyKey,
      });

      toast.success("Interesse registrado com sucesso! Entraremos em contato em breve.");
      setFormData({ name: "", email: "", phone: "", source: "", message: "", website: "" });
      resetProtectionFields();
      setSubmitted(true);
    } catch (error) {
      console.error("Erro ao enviar lead para o backend", error);
      resetProtectionFields();
      toast.error("Não foi possível enviar seu interesse agora. Tente novamente em instantes.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-card rounded-2xl shadow-card p-8 md:p-12 max-w-2xl mx-auto">
      <h3 className="text-2xl font-display font-bold text-center mb-6 text-gradient-gold">
        Tenho Interesse
      </h3>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="absolute left-[-10000px] top-auto h-px w-px overflow-hidden" aria-hidden="true">
          <Label htmlFor="website">Website</Label>
          <Input
            id="website"
            name="website"
            type="text"
            value={formData.website}
            onChange={(e) => updateField("website", e.target.value)}
            tabIndex={-1}
            autoComplete="off"
          />
        </div>

        {effectiveFields.name && (
          <div>
            <Label htmlFor="name" className="text-foreground">
              Nome completo *
            </Label>
            <Input
              id="name"
              type="text"
              value={formData.name}
              onChange={(e) => updateField("name", e.target.value)}
              className="mt-2 bg-secondary border-border text-foreground"
              placeholder="Seu nome completo"
              required
            />
          </div>
        )}

        {effectiveFields.email && (
          <div>
            <Label htmlFor="email" className="text-foreground">
              E-mail *
            </Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => updateField("email", e.target.value)}
              className="mt-2 bg-secondary border-border text-foreground"
              placeholder="seu@email.com"
              required
            />
          </div>
        )}

        {effectiveFields.phone && (
          <div>
            <Label htmlFor="phone" className="text-foreground">
              Telefone *
            </Label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => updateField("phone", e.target.value)}
              className="mt-2 bg-secondary border-border text-foreground"
              placeholder="(00) 00000-0000"
              required
            />
          </div>
        )}

        <div>
          <Label htmlFor="message" className="text-foreground">
            Dúvidas (opcional)
          </Label>
          <Textarea
            id="message"
            value={formData.message}
            maxLength={500}
            onChange={(e) => updateField("message", e.target.value)}
            className="mt-2 bg-secondary border-border text-foreground"
            placeholder="Escreva suas dúvidas ou observações (até 500 caracteres)"
            aria-describedby="message-help"
          />
          <p id="message-help" className="text-xs text-muted-foreground mt-1">
            Campo opcional. Máximo de 500 caracteres.
          </p>
        </div>

        {effectiveFields.source && (
          <div>
          <Label htmlFor="source" className="text-foreground">
            Como chegou até aqui? *
          </Label>
          <Select
            value={formData.source}
            onValueChange={(value) => updateField("source", value)}
            required
          >
            <SelectTrigger className="mt-2 bg-secondary border-border text-foreground">
              <SelectValue placeholder="Selecione uma opção" />
            </SelectTrigger>
              <SelectContent>
                {leadSourceOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {captchaSiteKey && (
          <TurnstileCaptcha key={formStartedAt} siteKey={captchaSiteKey} onTokenChange={updateCaptchaToken} />
        )}

        <div className="space-y-3">
          {submitted ? (
            <WhatsAppButton
              courseName={courseName}
              variant="hero"
              size="lg"
              className="w-full justify-center gap-2"
              label="Falar no WhatsApp"
            />
          ) : (
            <Button type="submit" variant="hero" size="lg" className="w-full" disabled={submitting}>
              {submitting ? "Enviando..." : "Tenho Interesse"}
            </Button>
          )}
        </div>
      </form>
    </div>
  );
};

export default CourseForm;
