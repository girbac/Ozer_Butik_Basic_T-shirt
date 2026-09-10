/*
 * Türkçe metni URL ve SKU'da kullanılabilir hâle getirir.
 *
 * Neden ayrı bir işlev: JavaScript'in yerleşik küçültmesi Türkçe'yi doğru
 * çevirmiyor. "I".toLowerCase() → "i" veriyor ama Türkçe'de "I"nın küçüğü "ı";
 * "İ" ise "i̇" gibi iki kod noktalı bir şeye dönüşüyor ve URL'de bozuk görünüyor.
 * Bu yüzden Türkçe harfleri ÖNCE elle karşılıklarına çeviriyoruz, küçültmeyi
 * ondan sonra yapıyoruz.
 *
 * Çıktı yalnızca a-z, 0-9 ve tire içerir; hem adres çubuğunda hem SKU'da
 * sorunsuz durur.
 */

const TURKISH_MAP: Record<string, string> = {
  ç: "c",
  Ç: "c",
  ğ: "g",
  Ğ: "g",
  ı: "i",
  I: "i",
  İ: "i",
  i: "i",
  ö: "o",
  Ö: "o",
  ş: "s",
  Ş: "s",
  ü: "u",
  Ü: "u",
  â: "a",
  Â: "a",
  î: "i",
  Î: "i",
  û: "u",
  Û: "u",
};

/** "Ağır Gramaj Basic Tee" → "agir-gramaj-basic-tee" */
export function toSlug(input: string): string {
  return input
    .split("")
    .map((character) => TURKISH_MAP[character] ?? character)
    .join("")
    .toLowerCase()
    // Aksanlı latin harfleri (é, ñ …) taban harflerine indir
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Alınmış olanlarla çakışmayan bir slug üretir.
 *
 * Çakışma olursa sona -2, -3 … ekler. Aynı adda ikinci bir ürün eklemek
 * (ör. sezonluk bir tekrar) engellenmemeli; sadece adresi ayrışmalı.
 */
export function uniqueSlug(input: string, taken: Iterable<string>): string {
  const base = toSlug(input) || "urun";
  const used = new Set(taken);
  if (!used.has(base)) return base;

  let counter = 2;
  while (used.has(`${base}-${counter}`)) counter++;
  return `${base}-${counter}`;
}
