import type { Metadata } from "next";
import { CartPageView } from "@/components/CartPageView";

export const metadata: Metadata = {
  title: "Sepet",
  robots: { index: false, follow: false },
};

export default function CartPage() {
  return <CartPageView />;
}
