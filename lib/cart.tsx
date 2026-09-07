"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import {
  addItem as addItemToStore,
  calculateItemCount,
  calculateSubtotal,
  clearCart as clearStore,
  getServerSnapshot,
  getSnapshot,
  removeItem as removeFromStore,
  subscribe,
  updateQuantity as updateStoreQuantity,
  type CartItem,
} from "@/lib/cart-store";

export type { CartItem };

type CartContextValue = {
  items: CartItem[];
  /** Hidrasyon tamamlanana kadar false — sunucu/istemci uyuşmazlığını önler. */
  isReady: boolean;
  isDrawerOpen: boolean;
  itemCount: number;
  subtotal: number;
  addItem: (item: Omit<CartItem, "quantity">, quantity?: number) => void;
  updateQuantity: (variantId: string, quantity: number) => void;
  removeItem: (variantId: string) => void;
  clearCart: () => void;
  openDrawer: () => void;
  closeDrawer: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

/** Hidrasyon bitti mi? Sunucuda ve ilk render'da false, sonrasında true. */
const noopSubscribe = () => () => {};
function useIsHydrated(): boolean {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
}

export function CartProvider({ children }: { children: ReactNode }) {
  const items = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const isReady = useIsHydrated();
  const [isDrawerOpen, setDrawerOpen] = useState(false);

  const openDrawer = useCallback(() => setDrawerOpen(true), []);
  const closeDrawer = useCallback(() => setDrawerOpen(false), []);

  // Sepete ekleyince çekmece açılsın — kullanıcı eklendiğini görsün.
  const addItem = useCallback(
    (item: Omit<CartItem, "quantity">, quantity = 1) => {
      addItemToStore(item, quantity);
      setDrawerOpen(true);
    },
    [],
  );

  // Çekmece açıkken arkadaki sayfa kaymasın (özellikle mobilde önemli).
  useEffect(() => {
    if (!isDrawerOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [isDrawerOpen]);

  const value = useMemo<CartContextValue>(
    () => ({
      items,
      isReady,
      isDrawerOpen,
      itemCount: calculateItemCount(items),
      subtotal: calculateSubtotal(items),
      addItem,
      updateQuantity: updateStoreQuantity,
      removeItem: removeFromStore,
      clearCart: clearStore,
      openDrawer,
      closeDrawer,
    }),
    [items, isReady, isDrawerOpen, addItem, openDrawer, closeDrawer],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart yalnızca CartProvider içinde kullanılabilir.");
  }
  return context;
}
