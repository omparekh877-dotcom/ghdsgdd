import * as React from "react";

import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, onFocus, onBlur, ...props }, ref) => {
    const isNumeric = (t?: string) => t === "number";

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      onFocus?.(e);
      try {
        if (isNumeric(type) || (props as any).inputMode === "numeric" || (props as any)["data-numeric"]) {
          // Select-all so overwriting is clean on focus
          e.currentTarget.select();
        }
      } catch {}
    };

    const normalizeNumeric = (value: string) => {
      const v = value.trim();
      if (v === "") return v;
      // Keep decimals, remove unnecessary leading zeros (handles negatives as well)
      // Examples: 0005 -> 5, 01.20 -> 1.2, -0003 -> -3, 0.5 stays 0.5
      const num = Number(v);
      if (!Number.isNaN(num)) {
        // Preserve integer vs decimal formatting naturally
        return String(num);
      }
      return value;
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      try {
        if (isNumeric(type) || (props as any).inputMode === "numeric" || (props as any)["data-numeric"]) {
          const next = normalizeNumeric(e.currentTarget.value);
          if (next !== e.currentTarget.value) {
            // If uncontrolled, update value directly
            e.currentTarget.value = next;
            // If a controlled parent is listening, trigger onBlur first
          }
        }
      } catch {}
      onBlur?.(e);
    };

    return (
      <input
        type={type}
        className={cn(
          "flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          className,
        )}
        ref={ref}
        onFocus={handleFocus}
        onBlur={handleBlur}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
