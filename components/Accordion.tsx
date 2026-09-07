"use client";

import { useId, useState, type ReactNode } from "react";
import { ChevronDownIcon } from "@/components/Icons";

/** Varsayılan kapalı akordiyon. Ürün sayfasında detayları gizleyip sayfayı sade tutar. */
export function Accordion({
  title,
  children,
  defaultOpen = false,
}: {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
}) {
  const [isOpen, setOpen] = useState(defaultOpen);
  const panelId = useId();

  return (
    <div className="border-b border-line">
      <h3>
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={isOpen}
          aria-controls={panelId}
          className="flex min-h-[52px] w-full items-center justify-between gap-4 py-3 text-left text-sm font-medium"
        >
          {title}
          <ChevronDownIcon
            className={`h-4 w-4 shrink-0 transition-transform duration-200 ${
              isOpen ? "rotate-180" : ""
            }`}
          />
        </button>
      </h3>
      <div id={panelId} hidden={!isOpen} className="pb-4 text-sm leading-relaxed text-ink-muted">
        {children}
      </div>
    </div>
  );
}
