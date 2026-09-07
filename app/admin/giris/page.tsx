import type { Metadata } from "next";
import { LoginForm } from "@/components/admin/LoginForm";

export const metadata: Metadata = {
  title: "Yönetim Girişi",
  robots: { index: false, follow: false },
};

export default async function AdminLoginPage(props: PageProps<"/admin/giris">) {
  const searchParams = await props.searchParams;
  const next = Array.isArray(searchParams.devam) ? searchParams.devam[0] : searchParams.devam;

  return <LoginForm next={next ?? "/admin"} />;
}
