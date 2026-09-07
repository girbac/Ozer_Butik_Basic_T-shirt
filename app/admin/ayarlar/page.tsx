import type { Metadata } from "next";
import { getSettings } from "@/lib/settings";
import { HAS_MISSING_STORE_INFO } from "@/lib/store-info";
import { SettingsForm } from "@/components/admin/SettingsForm";

export const metadata: Metadata = {
  title: "Ayarlar",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const settings = await getSettings();

  return (
    <div className="container-page py-8">
      <h1 className="display text-2xl md:text-3xl">Ayarlar</h1>

      {HAS_MISSING_STORE_INFO && (
        <p role="alert" className="mt-5 border border-danger px-4 py-3 text-sm leading-relaxed text-danger">
          <strong>Yasal bilgiler eksik.</strong> Ticari unvan, adres, vergi ve ETBİS
          bilgileri henüz girilmedi. Bu bilgiler yasal sayfalarda göründüğü için
          satışa başlamadan önce <code>lib/store-info.ts</code> dosyasında
          doldurulmalı.
        </p>
      )}

      <div className="mt-6 max-w-lg">
        <SettingsForm settings={settings} />
      </div>
    </div>
  );
}
