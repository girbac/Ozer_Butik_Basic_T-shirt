"use client";

import { useEffect, useRef } from "react";
import { SIZE_CHART, SIZE_GUIDE_TIPS } from "@/lib/sizes";
import { CloseIcon } from "@/components/Icons";

/*
 * Beden tablosu. Mobilde alttan yükselen tam genişlikte bir panel,
 * masaüstünde ortada bir kutu olarak açılır. Tablo dar ekranda kendi içinde kayar.
 */
export function SizeGuideModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panelRef.current?.focus();
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previous;
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="size-guide-title"
        tabIndex={-1}
        className="relative flex max-h-[85vh] w-full max-w-lg flex-col rounded-t-[28px] bg-surface shadow-[var(--shadow-float)] sm:max-h-[80vh] sm:rounded-[28px]"
      >
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <h2 id="size-guide-title" className="display text-lg">Beden Tablosu</h2>
          <button
            type="button"
            onClick={onClose}
            className="-mr-2 flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-surface-2"
            aria-label="Beden tablosunu kapat"
          >
            <CloseIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="overflow-y-auto overscroll-contain px-5 py-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
          <div className="-mx-5 overflow-x-auto px-5">
            <table className="w-full min-w-[420px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-ink text-left">
                  {SIZE_CHART.columns.map((column) => (
                    <th key={column} className="py-2 pr-4 font-medium whitespace-nowrap">
                      {column}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {SIZE_CHART.rows.map((row) => (
                  <tr key={row[0]} className="border-b border-line">
                    {row.map((cell, index) => (
                      <td
                        key={index}
                        className={`py-2.5 pr-4 tabular-nums ${
                          index === 0 ? "font-medium" : "text-ink-muted"
                        }`}
                      >
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <h3 className="label mt-7">Hangi bedeni seçmeliyim?</h3>
          <ul className="mt-3 space-y-2.5">
            {SIZE_GUIDE_TIPS.map((tip) => (
              <li key={tip} className="flex gap-2 text-sm leading-relaxed text-ink-muted">
                <span aria-hidden="true" className="text-disabled">—</span>
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
