"use server";

import { priceCart, type CartLineInput, type PricedCart } from "@/lib/cart-server";

/**
 * Tarayıcıdaki sepeti sunucuda yeniden fiyatlandırır.
 *
 * İstemciden yalnızca varyant kimliği ve adet alınır; ad, fiyat ve stok
 * veritabanından okunur.
 *
 * Kupon da yalnızca KOD olarak geliyor; indirim tutarını sunucu hesaplıyor.
 * İstemciden gelen bir tutara güvenmek, tarayıcı konsolundan istenen indirimin
 * yazılabilmesi demek olurdu.
 */
export async function revalidateCart(
  lines: CartLineInput[],
  couponCode?: string | null,
): Promise<PricedCart> {
  return priceCart(lines, couponCode ?? null);
}
