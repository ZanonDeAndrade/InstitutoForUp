import { useState } from "react";
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
import { leadSourceOptions } from "@/constants/leadSources";
import { leadApi } from "@/services/leadApi";

interface CourseFormFieldsConfig {
  name: boolean;
  email: boolean;
  phone: boolean;
  source: boolean;
}

interface CourseFormProps {
  courseName: string;
  fields?: CourseFormFieldsConfig;
}

const CourseForm = ({ courseName, fields }: CourseFormProps) => {
  interface Lead {
    name: string;
    email: string;
    phone: string;
    source: string;
    message?: string;
    course: string;
    submittedAt: string;
  }

  const effectiveFields: CourseFormFieldsConfig = fields ?? {
    name: true,
    email: true,
    phone: true,
    source: true,
  };

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    source: "",
    message: "",
  });
  const [submitting, setSubmitting] = useState(false);

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

    const newLead: Lead = {
      ...formData,
      message: formData.message?.trim() || undefined,
      course: courseName,
      submittedAt: new Date().toISOString(),
    };

    setSubmitting(true);
    try {
      await leadApi.create({
        name: newLead.name,
        email: newLead.email,
        phone: newLead.phone,
        source: newLead.source,
        message: newLead.message,
        course: newLead.course,
      });

      try {
        const existing =
          typeof window !== "undefined" ? window.localStorage.getItem("forup_leads") : null;
        const parsed: Lead[] = existing ? JSON.parse(existing) : [];
        const updated = [...parsed, newLead];
        if (typeof window !== "undefined") {
          window.localStorage.setItem("forup_leads", JSON.stringify(updated));
        }
      } catch (error) {
        console.error("Erro ao salvar o lead localmente", error);
      }

      toast.success("Interesse registrado com sucesso! Entraremos em contato em breve.");
      setFormData({ name: "", email: "", phone: "", source: "", message: "" });
    } catch (error) {
      console.error("Erro ao enviar lead para o backend", error);
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
        {effectiveFields.name && (
          <div>
            <Label htmlFor="name" className="text-foreground">
              Nome completo *
            </Label>
            <Input
              id="name"
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
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
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
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
            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
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
              onValueChange={(value) => setFormData({ ...formData, source: value })}
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

        <Button type="submit" variant="hero" size="lg" className="w-full" disabled={submitting}>
          {submitting ? "Enviando..." : "Tenho Interesse"}
        </Button>
      </form>
    </div>
  );
};

export default CourseForm;
