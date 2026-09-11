/*
 * Çerez/ölçüm izni. Sepet deposuyla aynı desen: kaynak localStorage, React
 * ona useSyncExternalStore ile abone oluyor (bkz. lib/cart-store.ts).
 *
 * Neden izin gerekiyor: ölçüm eklemeden önce site hiçbir şey saymıyordu.
 * KVKK kapsamında, zorunlu olmayan ölçüm için ziyaretçinin açık rızası
 * aranıyor. Bu yüzden ölçüm kodu izin verilmeden YÜKLENMİYOR — banner'ı
 * kapatmak veya görmezden gelmek izin sayılmıyor.
 */

export type Consent = "kabul" | "ret" | null;

const STORAGE_KEY = "ozer-butik-cerez-izni-v1";

const listeners = new Set<() => void>();

/*
 * getSnapshot her çağrıldığında aynı değeri döndürmeli. localStorage'ı her
 * seferinde okumak string döndürdüğü için sorun çıkarmaz (ilkel değerler
 * referansla değil değerle karşılaştırılır), yine de gereksiz okuma olmasın
 * diye sonuç saklanıyor.
 */
let snapshot: Consent = null;
let isInitialized = false;

function read(): Consent {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw === "kabul" || raw === "ret" ? raw : null;
  } catch {
    // Gizli sekmede veya çerezleri kapatmış tarayıcıda erişim hata fırlatabilir.
    // O durumda izin yok sayılır — yani ölçüm çalışmaz. Doğru taraf bu.
    return null;
  }
}

function emit(): void {
  for (const listener of listeners) listener();
}

export function subscribeConsent(listener: () => void): () => void {
  listeners.add(listener);
  // Başka bir sekmede verilen karar bu sekmeye de yansısın.
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) window.removeEventListener("storage", onStorage);
  };
}

function onStorage(event: StorageEvent): void {
  if (event.key !== STORAGE_KEY) return;
  snapshot = read();
  emit();
}

export function getConsentSnapshot(): Consent {
  if (!isInitialized) {
    snapshot = read();
    isInitialized = true;
  }
  return snapshot;
}

/** Sunucuda localStorage yok; izin bilinmiyor kabul edilir. */
export function getConsentServerSnapshot(): Consent {
  return null;
}

export function setConsent(value: Exclude<Consent, null>): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, value);
  } catch {
    // Yazılamasa bile bu sekmede karar geçerli olsun; banner tekrar açılmasın.
  }
  snapshot = value;
  isInitialized = true;
  emit();
}
