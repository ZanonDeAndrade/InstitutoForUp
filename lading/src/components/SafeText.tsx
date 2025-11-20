import type { ComponentPropsWithoutRef, ElementType, ReactNode } from "react";

import { cn } from "@/lib/utils";

type SafeTextProps<T extends ElementType = "p"> = ComponentPropsWithoutRef<T> & {
  as?: T;
  children?: ReactNode;
  /**
   * When true, preserve user line breaks instead of collapsing whitespace.
   */
  preserveLineBreaks?: boolean;
  /**
   * When true, allow breaking anywhere to avoid overflow on very long tokens.
   */
  breakAll?: boolean;
};

const SafeText = <T extends ElementType = "p">({
  as,
  children,
  preserveLineBreaks = false,
  breakAll = false,
  className,
  ...props
}: SafeTextProps<T>) => {
  const Component = as ?? "p";

  return (
    <Component
      className={cn(
        "whitespace-normal break-words [word-break:break-word] [overflow-wrap:break-word]",
        preserveLineBreaks && "whitespace-pre-wrap",
        breakAll && "break-all",
        className,
      )}
      {...props}
    >
      {children ?? "—"}
    </Component>
  );
};

export default SafeText;
