// Para birimi tek bir yerden biçimlendirilir. Değerler her zaman KURUŞ cinsinden Int'tir.

const tryFormatter = new Intl.NumberFormat("tr-TR", {
  style: "currency",
  currency: "TRY",
  minimumFractionDigits: 2,
});

/** 49900 → "₺499,00" */
export function formatPrice(kurus: number): string {
  return tryFormatter.format(kurus / 100);
}

/** iyzico ondalıklı string bekler: 49900 → "499.00" */
export function kurusToIyzicoPrice(kurus: number): string {
  return (kurus / 100).toFixed(2);
}

const dateFormatter = new Intl.DateTimeFormat("tr-TR", {
  day: "2-digit",
  month: "long",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export function formatDate(date: Date): string {
  return dateFormatter.format(date);
}
