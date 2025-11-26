import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { News, UpsertNewsDto } from "@/types/news";

interface NewsFormProps {
  initial?: News | null;
  submitting?: boolean;
  submitLabel?: string;
  onSubmit: (payload: UpsertNewsDto) => Promise<void>;
}

const slugify = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "") || `news-${Date.now()}`;

const NewsForm = ({ initial, submitting, submitLabel = "Salvar post", onSubmit }: NewsFormProps) => {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [subtitle, setSubtitle] = useState(initial?.subtitle ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [content, setContent] = useState(initial?.content ?? "");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [autoSlug, setAutoSlug] = useState(!initial?.slug);
  const [previewUrl, setPreviewUrl] = useState<string | null>(initial?.imageUrl ?? null);

  useEffect(() => {
    setTitle(initial?.title ?? "");
    setSubtitle(initial?.subtitle ?? "");
    setSlug(initial?.slug ?? "");
    setContent(initial?.content ?? "");
    setImageFile(null);
    setAutoSlug(!initial?.slug);
    setPreviewUrl(initial?.imageUrl ?? null);
  }, [initial?.id, initial?.slug, initial?.publishedAt, initial?.title, initial?.content, initial?.subtitle]);

  useEffect(() => {
    if (autoSlug && title) {
      setSlug(slugify(title));
    }
  }, [title, autoSlug]);

  useEffect(() => {
    if (!imageFile) return undefined;
    const url = URL.createObjectURL(imageFile);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [imageFile]);

  const handleSelectImage = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024 || !["image/png", "image/jpeg", "image/jpg"].includes(file.type)) {
      toast.error("Use uma imagem PNG/JPG de até 2MB.");
      return;
    }
    setImageFile(file);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!title.trim()) {
      toast.error("Informe o título do post.");
      return;
    }
    if (!content.trim()) {
      toast.error("Adicione o conteúdo ou resumo do post.");
      return;
    }

    const payload: UpsertNewsDto = {
      title: title.trim(),
      subtitle: subtitle.trim() || undefined,
      content: content.trim(),
      slug: slug.trim() || undefined,
      imageFile,
    };

    await onSubmit(payload);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Título *</Label>
          <Input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Título do post"
            className="bg-secondary border-border"
          />
        </div>
        <div className="space-y-2">
          <Label>Slug (opcional)</Label>
          <Input
            value={slug}
            onChange={(event) => {
              setSlug(event.target.value);
              setAutoSlug(false);
            }}
            placeholder="meu-slug-amigavel"
            className="bg-secondary border-border"
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Subtítulo</Label>
          <Input
            value={subtitle}
            onChange={(event) => setSubtitle(event.target.value)}
            placeholder="Uma frase curta que resuma o post"
            className="bg-secondary border-border"
          />
        </div>
        <div className="space-y-2">
          <Label>Imagem principal (PNG/JPG, até 2MB)</Label>
          <Input
            type="file"
            accept="image/png,image/jpeg,image/jpg"
            onChange={handleSelectImage}
            className="bg-secondary border-border"
          />
          {previewUrl && (
            <div className="mt-2 h-32 w-full overflow-hidden rounded-lg border border-border/60">
              <img src={previewUrl} alt="Pré-visualização" className="h-full w-full object-cover" />
            </div>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label>Conteúdo / Markdown *</Label>
        <Textarea
          value={content}
          onChange={(event) => setContent(event.target.value)}
          rows={8}
          className="bg-secondary border-border min-h-[200px]"
          placeholder="Escreva o conteúdo completo. Markdown básico é aceito."
        />
        <p className="text-xs text-muted-foreground">
          Você pode usar Markdown para títulos, listas e links (ex.: **negrito**, _itálico_, [link](https://)).
        </p>
      </div>

      <div className="flex justify-end">
        <Button type="submit" variant="hero" disabled={submitting}>
          {submitting ? "Salvando..." : submitLabel}
        </Button>
      </div>
    </form>
  );
};

export default NewsForm;
