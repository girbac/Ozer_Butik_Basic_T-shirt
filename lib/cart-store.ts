/*
 * Sepetin kendisi. React'ten bağımsız, modül seviyesinde bir depo:
 * kaynak localStorage, React ona `useSyncExternalStore` ile abone oluyor.
 *
 * Neden effect içinde setState değil de böyle: localStorage sunucuda yok, bu yüzden
 * sunucu render'ı her zaman boş sepet üretir. `useSyncExternalStore` bu durumu
 * (sunucu anlık görüntüsü / istemci anlık görüntüsü ayrımıyla) hidrasyon uyarısı
 * çıkarmadan çözer. Yan fayda: aynı siteyi iki sekmede açan kullanıcıda sepet
 * senkron kalır.
 *
 * Fiyat ve stok burada sadece GÖSTERİM içindir; ödeme sırasında sunucu bu değerleri
 * veritabanından yeniden hesaplar. İstemciden gelen fiyata asla güvenilmez.
 */

export type CartItem = {
  variantId: string;
  productSlug: string;
  productName: string;
  colorName: string;
  size: string;
  unitPrice: number;
  quantity: number;
  image: string;
};

const STORAGE_KEY = "ozer-butik-sepet-v1";
export const MAX_QUANTITY_PER_ITEM = 10;

/** Sunucuda ve hidrasyon sırasında kullanılan sabit boş sepet. */
const EMPTY: CartItem[] = [];

const listeners = new Set<() => void>();

// getSnapshot her çağrıldığında AYNI referansı döndürmeli, yoksa sonsuz render olur.
let snapshot: CartItem[] = EMPTY;
let isInitialized = false;

function isCartItem(value: unknown): value is CartItem {
  if (typeof value !== "object" || value === null) return false;
  const item = value as Record<string, unknown>;
  return (
    typeof item.variantId === "string" &&
    typeof item.productSlug === "string" &&
    typeof item.productName === "string" &&
    typeof item.colorName === "string" &&
    typeof item.size === "string" &&
    typeof item.unitPrice === "number" &&
    typeof item.quantity === "number" &&
    item.quantity > 0 &&
    typeof item.image === "string"
  );
}

function readStorage(): CartItem[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY;
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return EMPTY;
    const valid = parsed.filter(isCartItem);
    return valid.length > 0 ? valid : EMPTY;
  } catch {
    // Gizli sekme, dolu depolama veya bozuk veri: sepet boş görünsün, sayfa çökmesin.
    return EMPTY;
  }
}

function writeStorage(items: CartItem[]) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // Depolama yazılamıyorsa sepet yalnızca bu oturumda yaşar — kullanıcıyı engellemeyiz.
  }
}

function emit() {
  for (const listener of listeners) listener();
}

function setItems(next: CartItem[]) {
  snapshot = next;
  writeStorage(next);
  emit();
}

export function subscribe(listener: () => void): () => void {
  // İlk abonelikte localStorage'dan yükle. Bu, React render'ı sırasında değil,
  // abone olma anında (effect içinde) çalışır — güvenli.
  if (!isInitialized) {
    isInitialized = true;
    snapshot = readStorage();
  }

  listeners.add(listener);

  // Başka bir sekmede sepet değişirse burada da güncellensin.
  const onStorage = (event: StorageEvent) => {
    if (event.key !== STORAGE_KEY) return;
    snapshot = readStorage();
    emit();
  };

  if (listeners.size === 1) {
    window.addEventListener("storage", onStorage);
  }

  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

export function getSnapshot(): CartItem[] {
  return snapshot;
}

export function getServerSnapshot(): CartItem[] {
  return EMPTY;
}

export function addItem(item: Omit<CartItem, "quantity">, quantity = 1) {
  const current = snapshot;
  const existing = current.find((entry) => entry.variantId === item.variantId);

  if (existing) {
    setItems(
      current.map((entry) =>
        entry.variantId === item.variantId
          ? {
              ...entry,
              quantity: Math.min(entry.quantity + quantity, MAX_QUANTITY_PER_ITEM),
            }
          : entry,
      ),
    );
    return;
  }

  setItems([...current, { ...item, quantity: Math.min(quantity, MAX_QUANTITY_PER_ITEM) }]);
}

export function updateQuantity(variantId: string, quantity: number) {
  if (quantity <= 0) {
    removeItem(variantId);
    return;
  }
  setItems(
    snapshot.map((entry) =>
      entry.variantId === variantId
        ? { ...entry, quantity: Math.min(quantity, MAX_QUANTITY_PER_ITEM) }
        : entry,
    ),
  );
}

export function removeItem(variantId: string) {
  const next = snapshot.filter((entry) => entry.variantId !== variantId);
  setItems(next.length > 0 ? next : EMPTY);
}

export function clearCart() {
  setItems(EMPTY);
}

export function calculateSubtotal(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
}

export function calculateItemCount(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.quantity, 0);
}

/**
 * Sepeti sunucunun doğruladığı satırlarla değiştirir (fiyat/stok düzeltmesi sonrası).
 *
 * İçerik zaten aynıysa HİÇBİR ŞEY yapmaz — aynı referansı koruyarak React'te
 * gereksiz render ve sonsuz doğrulama döngüsü oluşmasını engeller.
 */
export function replaceCart(items: CartItem[]) {
  if (serialize(items) === serialize(snapshot)) return;
  setItems(items.length > 0 ? items : EMPTY);
}

function serialize(items: CartItem[]): string {
  return items
    .map((i) => `${i.variantId}:${i.quantity}:${i.unitPrice}`)
    .sort()
    .join("|");
}
