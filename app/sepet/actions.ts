"use server";

import { priceCart, type CartLineInput, type PricedCart } from "@/lib/cart-server";

/**
 * Tarayıcıdaki sepeti sunucuda yeniden fiyatlandırır.
 *
 * İstemciden yalnızca varyant kimliği ve adet alınır; ad, fiyat ve stok
 * veritabanından okunur.
 */
export async function revalidateCart(lines: CartLineInput[]): Promise<PricedCart> {
  return priceCart(lines);
}
