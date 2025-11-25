import { MessageCircle } from "lucide-react";

import { Button, type ButtonProps } from "@/components/ui/button";

const WHATSAPP_NUMBER = "5511976747650";

export interface WhatsAppButtonProps extends Omit<ButtonProps, "onClick"> {
  courseName?: string;
  label?: string;
}

const WhatsAppButton = ({
  courseName,
  label = "Falar no WhatsApp",
  variant = "hero",
  size = "lg",
  className,
  ...props
}: WhatsAppButtonProps) => {
  const message = courseName
    ? `Olá, tenho interesse no curso ${courseName}`
    : "Olá, gostaria de saber mais sobre os cursos do Instituto FOR UP Education";
  const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
  const ariaLabel = courseName ? `Abrir WhatsApp sobre ${courseName}` : "Abrir conversa no WhatsApp";

  return (
    <Button
      asChild
      variant={variant}
      size={size}
      className={className}
      {...props}
    >
      <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" aria-label={ariaLabel}>
        <MessageCircle className="w-5 h-5" />
        {label}
      </a>
    </Button>
  );
};

export default WhatsAppButton;
