import { useId, useState } from "react";

import SafeText from "@/components/SafeText";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface EllipsisTextProps {
  text: string;
  maxLength?: number;
  label?: string;
}

const EllipsisText = ({ text, maxLength = 50, label = "Ver texto completo" }: EllipsisTextProps) => {
  const safeText = text.trim();
  const hasOverflow = safeText.length > maxLength;
  const display = hasOverflow ? `${safeText.slice(0, maxLength)}...` : safeText || "—";
  const [open, setOpen] = useState(false);
  const descriptionId = useId();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          className="max-w-full cursor-pointer text-left text-sm text-muted-foreground"
          style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}
          aria-label={label}
          title={hasOverflow ? label : safeText}
        >
          {display}
        </button>
      </DialogTrigger>
      <DialogContent
        aria-describedby={descriptionId}
        className="max-w-[min(90vw,42rem)] sm:max-w-xl p-6 sm:p-7"
      >
        <DialogHeader className="gap-1.5">
          <DialogTitle>Dúvidas</DialogTitle>
          <p className="text-sm text-muted-foreground" aria-hidden="true">
            Mensagem completa enviada pelo participante.
          </p>
        </DialogHeader>
        <DialogDescription asChild id={descriptionId}>
          <SafeText
            as="div"
            preserveLineBreaks
            breakAll
            className="text-sm leading-relaxed text-foreground"
          >
            {safeText}
          </SafeText>
        </DialogDescription>
      </DialogContent>
    </Dialog>
  );
};

export default EllipsisText;
