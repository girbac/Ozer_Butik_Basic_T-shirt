"use client";

import { useEffect } from "react";
import { clearCart } from "@/lib/cart-store";

/**
 * Ödeme başarıyla tamamlandığında tarayıcıdaki sepeti boşaltır.
 *
 * Sepet localStorage'da tutulduğu için sunucu onu temizleyemez; başarı sayfası
 * açıldığında burada temizliyoruz. Yalnızca ödemesi alınmış siparişte render edilir,
 * böylece başarısız ödemede kullanıcının sepeti bozulmadan kalır.
 */
export function ClearCartOnSuccess() {
  useEffect(() => {
    clearCart();
  }, []);

  return null;
}
