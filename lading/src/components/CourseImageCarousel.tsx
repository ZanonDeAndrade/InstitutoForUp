import { useEffect, useMemo, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { CourseImage } from "@/types/course";
import { cn } from "@/lib/utils";

interface CourseImageCarouselProps {
  images?: CourseImage[];
  heightClass?: string;
}

const CourseImageCarousel = ({ images, heightClass = "h-72 md:h-96" }: CourseImageCarouselProps) => {
  const [failedIds, setFailedIds] = useState<Set<string>>(new Set());

  const normalizeUrl = (url: string) => {
    if (url.includes("localhost:400/")) {
      return url.replace("localhost:400/", "localhost:4001/");
    }
    if (url.includes("/courses/courses/")) {
      return url.replace("/courses/courses/", "/courses/");
    }
    return url;
  };

  const validImages = useMemo(
    () =>
      images
        ?.map((img) => (img?.url ? { ...img, url: normalizeUrl(img.url) } : img))
        .filter((img) => !!img?.url && !failedIds.has(img.id)) ?? [],
    [images, failedIds],
  );
  const hasMultiple = validImages.length > 1;
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: hasMultiple });
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    // debug log
    // eslint-disable-next-line no-console
    console.log("[carousel] images", validImages.map((img) => img.url));
    if (!emblaApi) return;
    const onSelect = () => {
      setSelectedIndex(emblaApi.selectedScrollSnap());
    };
    emblaApi.on("select", onSelect);
    return () => {
      emblaApi.off("select", onSelect);
    };
  }, [emblaApi]);

  if (validImages.length === 0) return null;

  return (
    <div className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-card" ref={emblaRef}>
      <div className="flex">
        {validImages.map((image) => (
          <div className="min-w-0 flex-[0_0_100%]" key={image.id}>
            <div className={cn("relative w-full", heightClass)}>
              <img
                src={image.url}
                alt={image.alt || "Imagem do curso"}
                className="h-full w-full object-cover"
                loading="lazy"
                onError={() => setFailedIds((prev) => new Set(prev).add(image.id))}
              />
              <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-background/40 to-transparent" />
            </div>
          </div>
        ))}
      </div>
      {hasMultiple && (
        <div className="flex items-center justify-center gap-2 py-3">
          {validImages.map((image, index) => (
            <button
              key={image.id}
              type="button"
              onClick={() => emblaApi?.scrollTo(index)}
              className={cn(
                "h-2 w-2 rounded-full transition-all duration-200",
                selectedIndex === index ? "bg-primary w-6" : "bg-primary/30",
              )}
              aria-label={`Ir para imagem ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default CourseImageCarousel;
