/*
 * Veritabanı hatalarını okunabilir bir teşhise çevirir.
 *
 * Neden gerekli: veritabanı bağlıyken bir sorun çıktığında site Vercel'in genel
 * "A server error occurred" ekranını gösteriyordu — mağaza sahibi için hiçbir
 * bilgi taşımayan, teşhis edilemeyen bir duvar. Artık sayfa ayakta kalıyor ve
 * sebebi söylüyor.
 *
 * Teknik ayrıntıyı müşteriye dökmüyoruz; yalnızca hangi sınıf sorun olduğunu ve
 * ne yapılması gerektiğini söyleyen kısa bir metin üretiyoruz.
 */

export type DatabaseDiagnosis = {
  /** Kullanıcıya gösterilecek kısa başlık */
  title: string;
  /** Ne yapılması gerektiği */
  action: string;
  /** Log'a yazılacak teknik kod (varsa) */
  code: string;
};

function readCode(error: unknown): string {
  if (typeof error !== "object" || error === null) return "";
  const candidate = error as { code?: unknown; name?: unknown };
  if (typeof candidate.code === "string") return candidate.code;
  if (typeof candidate.name === "string") return candidate.name;
  return "";
}

function readMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export function diagnoseDatabaseError(error: unknown): DatabaseDiagnosis {
  const code = readCode(error);
  const message = readMessage(error).toLowerCase();

  // Tablolar yok — migration hiç çalışmamış. En sık karşılaşılan durum:
  // veritabanı, derleme tamamlandıktan SONRA bağlanmış olur.
  // 42P01 = undefined_table (Postgres), P2021 = Prisma "table does not exist"
  if (code === "42P01" || code === "P2021" || message.includes("does not exist")) {
    return {
      title: "Veritabanı bağlı ama tablolar henüz oluşturulmamış",
      action:
        "Vercel'de Deployments → son yayın → Redeploy yapın. Tablolar yayın sırasında otomatik oluşturulur.",
      code: code || "undefined_table",
    };
  }

  // Sunucuya ulaşılamıyor
  if (
    code === "P1001" ||
    code === "ECONNREFUSED" ||
    code === "ENOTFOUND" ||
    code === "ETIMEDOUT" ||
    message.includes("can't reach database") ||
    message.includes("connection refused")
  ) {
    return {
      title: "Veritabanı sunucusuna ulaşılamıyor",
      action:
        "Vercel'de Storage sekmesinden veritabanının bu projeye bağlı ve etkin olduğunu doğrulayın, ardından Redeploy yapın.",
      code: code || "connection_failed",
    };
  }

  // Kimlik doğrulama
  if (code === "28P01" || code === "P1000" || message.includes("password authentication")) {
    return {
      title: "Veritabanı kullanıcı adı veya parolası kabul edilmedi",
      action:
        "DATABASE_URL değerinin güncel olduğunu kontrol edin. Veritabanını yeniden bağlayıp Redeploy yapmak genellikle çözer.",
      code: code || "auth_failed",
    };
  }

  return {
    title: "Veritabanına bağlanırken beklenmedik bir sorun oluştu",
    action:
      "Vercel'de Logs sekmesinden ayrıntıyı görebilirsiniz. Redeploy denemek çoğu geçici sorunu çözer.",
    code: code || "unknown",
  };
}
