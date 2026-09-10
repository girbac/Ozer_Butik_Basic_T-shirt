import { formatPrice } from "@/lib/format";
import { CheckIcon, TruckIcon } from "@/components/Icons";

/*
 * Ücretsiz kargo eşiğine ne kadar kaldığını gösteren ilerleme çubuğu.
 *
 * Hem sepet çekmecesinde hem sepet sayfasında kullanılıyor. Süs değil: eşiğin
 * ne kadar yakın olduğunu görmek sepet tutarını artıran en bilinen etkilerden
 * biri. Aynı zamanda sayfaya ölçülü bir renk getiriyor.
 */
export function FreeShippingBar({
  subtotal,
  threshold,
}: {
  subtotal: number;
  threshold: number;
}) {
  // Eşik kapalıysa (0) çubuğu hiç gösterme
  if (threshold <= 0) return null;

  const reached = subtotal >= threshold;
  const remaining = Math.max(threshold - subtotal, 0);
  const percent = Math.min(Math.round((subtotal / threshold) * 100), 100);

  return (
    <div className="rounded-2xl bg-surface-2 p-3.5">
      <p className="flex items-start gap-2 text-xs leading-relaxed">
        {reached ? (
          <>
            <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-success" />
            <span className="text-ink">
              Kargo <span className="font-medium text-success">ücretsiz</span> — teşekkürler!
            </span>
          </>
        ) : (
          <>
            <TruckIcon className="mt-0.5 h-4 w-4 shrink-0 text-ink-muted" />
            <span className="text-ink-muted">
              <span className="font-medium text-ink">{formatPrice(remaining)}</span> daha
              ekleyin, kargo ücretsiz olsun.
            </span>
          </>
        )}
      </p>

      <div
        className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-line"
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Ücretsiz kargo ilerlemesi"
      >
        <div
          className={`h-full rounded-full transition-all duration-500 ease-out ${
            reached ? "bg-success" : "bg-ink"
          }`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
