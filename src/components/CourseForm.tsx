import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

interface CourseFormProps {
  courseName: string;
}

const CourseForm = ({ courseName }: CourseFormProps) => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    source: ""
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validação básica
    if (!formData.name || !formData.email || !formData.phone || !formData.source) {
      toast.error("Por favor, preencha todos os campos");
      return;
    }

    // Aqui você pode integrar com sua API ou serviço de backend
    console.log("Formulário enviado:", { ...formData, course: courseName });
    
    toast.success("Interesse registrado com sucesso! Entraremos em contato em breve.");
    
    // Limpar formulário
    setFormData({ name: "", email: "", phone: "", source: "" });
  };

  return (
    <div className="bg-card rounded-2xl shadow-card p-8 md:p-12 max-w-2xl mx-auto">
      <h3 className="text-2xl font-display font-bold text-center mb-6 text-gradient-gold">
        Quero Participar
      </h3>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <Label htmlFor="name" className="text-foreground">Nome completo *</Label>
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

        <div>
          <Label htmlFor="email" className="text-foreground">E-mail *</Label>
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

        <div>
          <Label htmlFor="phone" className="text-foreground">Telefone *</Label>
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

        <div>
          <Label htmlFor="source" className="text-foreground">Como chegou até aqui? *</Label>
          <Select value={formData.source} onValueChange={(value) => setFormData({ ...formData, source: value })} required>
            <SelectTrigger className="mt-2 bg-secondary border-border text-foreground">
              <SelectValue placeholder="Selecione uma opção" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="indicacao">Indicação</SelectItem>
              <SelectItem value="redes-sociais">Redes Sociais</SelectItem>
              <SelectItem value="evento">Evento</SelectItem>
              <SelectItem value="outro">Outro</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button type="submit" variant="hero" size="lg" className="w-full">
          Quero participar
        </Button>
      </form>
    </div>
  );
};

export default CourseForm;
