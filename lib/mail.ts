import "server-only";

import { Resend } from "resend";
import { formatDate, formatPrice } from "@/lib/format";

/*
 * Sipariş e-postaları.
 *
 * E-posta gönderimi HİÇBİR ZAMAN siparişi bozmamalı: Resend erişilemezse veya
 * anahtar tanımlı değilse hata yutulur ve loglanır. Müşteri ödemesini yaptıysa
 * siparişi tamamlanmıştır; e-posta gitmemesi bunu geri almaz.
 */

type OrderEmailData = {
  orderNo: string;
  email: string;
  fullName: string;
  phone: string;
  city: string;
  district: string;
  address: string;
  note: string | null;
  subtotal: number;
  discount: number;
  couponCode: string | null;
  shippingFee: number;
  total: number;
  createdAt: Date;
  items: {
    productName: string;
    colorName: string;
    size: string;
    quantity: number;
    unitPrice: number;
  }[];
};

function getResend(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;
  return new Resend(apiKey);
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function itemRows(order: OrderEmailData): string {
  return order.items
    .map(
      (item) => `
    <tr>
      <td style="padding:10px 0;border-bottom:1px solid #e5e5e1;">
        <div style="font-size:14px;color:#111111;">${escapeHtml(item.productName)}</div>
        <div style="font-size:12px;color:#6b6b6b;">${escapeHtml(item.colorName)} · ${escapeHtml(item.size)} · ${item.quantity} adet</div>
      </td>
      <td style="padding:10px 0;border-bottom:1px solid #e5e5e1;text-align:right;font-size:14px;color:#111111;white-space:nowrap;">
        ${formatPrice(item.unitPrice * item.quantity)}
      </td>
    </tr>`,
    )
    .join("");
}

function summaryRows(order: OrderEmailData): string {
  return `
    <tr>
      <td style="padding:6px 0;font-size:14px;color:#6b6b6b;">Ara toplam</td>
      <td style="padding:6px 0;text-align:right;font-size:14px;">${formatPrice(order.subtotal)}</td>
    </tr>
    ${
      order.discount > 0
        ? `<tr>
      <td style="padding:6px 0;font-size:14px;color:#1e7a45;">İndirim${
        order.couponCode ? ` (${escapeHtml(order.couponCode)})` : ""
      }</td>
      <td style="padding:6px 0;text-align:right;font-size:14px;color:#1e7a45;">−${formatPrice(order.discount)}</td>
    </tr>`
        : ""
    }
    <tr>
      <td style="padding:6px 0;font-size:14px;color:#6b6b6b;">Kargo</td>
      <td style="padding:6px 0;text-align:right;font-size:14px;">
        ${order.shippingFee === 0 ? "Ücretsiz" : formatPrice(order.shippingFee)}
      </td>
    </tr>
    <tr>
      <td style="padding:12px 0 0;border-top:1px solid #111111;font-size:16px;font-weight:600;">Toplam</td>
      <td style="padding:12px 0 0;border-top:1px solid #111111;text-align:right;font-size:16px;font-weight:600;">
        ${formatPrice(order.total)}
      </td>
    </tr>`;
}

/** Tüm e-postalar için ortak, mobilde de düzgün görünen sade bir çerçeve. */
function layout(title: string, body: string): string {
  return `<!doctype html>
<html lang="tr">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(title)}</title></head>
<body style="margin:0;padding:24px 12px;background:#f6f6f4;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;background:#ffffff;">
    <tr><td style="padding:28px 24px;">
      <div style="font-size:13px;letter-spacing:3px;color:#111111;font-weight:600;">ÖZER BUTİK</div>
      ${body}
    </td></tr>
  </table>
  <p style="max-width:560px;margin:16px auto 0;font-size:11px;color:#6b6b6b;text-align:center;">
    Bu e-posta siparişiniz sebebiyle gönderilmiştir.
  </p>
</body>
</html>`;
}

async function send(to: string, subject: string, html: string): Promise<void> {
  const resend = getResend();

  if (!resend) {
    console.warn(`[mail] RESEND_API_KEY yok, e-posta gönderilmedi: "${subject}" → ${to}`);
    return;
  }

  const from = process.env.MAIL_FROM;
  if (!from) {
    console.warn("[mail] MAIL_FROM tanımlı değil, e-posta gönderilmedi.");
    return;
  }

  try {
    const { error } = await resend.emails.send({ from, to, subject, html });
    if (error) console.error("[mail] gönderim hatası:", error);
  } catch (error) {
    // Sipariş akışını asla kesme — e-posta gitmemesi ödemeyi geçersiz kılmaz.
    console.error("[mail] gönderim başarısız:", error);
  }
}

/** Müşteriye sipariş onayı. */
export async function sendOrderConfirmation(order: OrderEmailData): Promise<void> {
  const body = `
    <h1 style="margin:20px 0 8px;font-size:22px;font-weight:500;color:#111111;">Siparişiniz alındı</h1>
    <p style="margin:0 0 20px;font-size:14px;line-height:1.6;color:#6b6b6b;">
      Merhaba ${escapeHtml(order.fullName.split(" ")[0])}, siparişiniz için teşekkür ederiz.
      Kargoya verildiğinde takip numarasını bu adrese göndereceğiz.
    </p>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
      <tr>
        <td style="font-size:13px;color:#6b6b6b;">Sipariş no</td>
        <td style="font-size:13px;text-align:right;font-weight:600;">${escapeHtml(order.orderNo)}</td>
      </tr>
      <tr>
        <td style="font-size:13px;color:#6b6b6b;">Tarih</td>
        <td style="font-size:13px;text-align:right;">${formatDate(order.createdAt)}</td>
      </tr>
    </table>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      ${itemRows(order)}
      ${summaryRows(order)}
    </table>

    <div style="margin-top:24px;padding-top:16px;border-top:1px solid #e5e5e1;">
      <div style="font-size:12px;letter-spacing:1px;color:#111111;font-weight:600;">TESLİMAT ADRESİ</div>
      <p style="margin:8px 0 0;font-size:14px;line-height:1.6;color:#6b6b6b;">
        ${escapeHtml(order.fullName)}<br>
        ${escapeHtml(order.address)}<br>
        ${escapeHtml(order.district)} / ${escapeHtml(order.city)}<br>
        ${escapeHtml(order.phone)}
      </p>
    </div>`;

  await send(order.email, `Siparişiniz alındı — ${order.orderNo}`, layout("Siparişiniz alındı", body));
}

/** Satıcıya yeni sipariş bildirimi. */
export async function sendSellerNotification(order: OrderEmailData): Promise<void> {
  const to = process.env.ORDER_NOTIFICATION_EMAIL;
  if (!to) {
    console.warn("[mail] ORDER_NOTIFICATION_EMAIL tanımlı değil, satıcı bildirimi atlandı.");
    return;
  }

  const body = `
    <h1 style="margin:20px 0 8px;font-size:22px;font-weight:500;color:#111111;">Yeni sipariş</h1>
    <p style="margin:0 0 20px;font-size:14px;color:#6b6b6b;">
      ${escapeHtml(order.orderNo)} · ${formatDate(order.createdAt)}
    </p>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      ${itemRows(order)}
      ${summaryRows(order)}
    </table>

    <div style="margin-top:24px;padding-top:16px;border-top:1px solid #e5e5e1;">
      <div style="font-size:12px;letter-spacing:1px;font-weight:600;">MÜŞTERİ</div>
      <p style="margin:8px 0 0;font-size:14px;line-height:1.6;color:#6b6b6b;">
        ${escapeHtml(order.fullName)}<br>
        ${escapeHtml(order.phone)} · ${escapeHtml(order.email)}<br>
        ${escapeHtml(order.address)}<br>
        ${escapeHtml(order.district)} / ${escapeHtml(order.city)}
      </p>
      ${
        order.note
          ? `<p style="margin:12px 0 0;padding:10px;background:#f6f6f4;font-size:13px;color:#111111;">
               <strong>Sipariş notu:</strong> ${escapeHtml(order.note)}
             </p>`
          : ""
      }
    </div>`;

  await send(to, `Yeni sipariş: ${order.orderNo} — ${formatPrice(order.total)}`, layout("Yeni sipariş", body));
}

/** Kargo takip numarası girildiğinde müşteriye bildirim. */
export async function sendShippingNotification(
  order: Pick<OrderEmailData, "orderNo" | "email" | "fullName">,
  trackingCode: string,
): Promise<void> {
  const body = `
    <h1 style="margin:20px 0 8px;font-size:22px;font-weight:500;color:#111111;">Siparişiniz kargoda</h1>
    <p style="margin:0 0 20px;font-size:14px;line-height:1.6;color:#6b6b6b;">
      Merhaba ${escapeHtml(order.fullName.split(" ")[0])}, ${escapeHtml(order.orderNo)} numaralı
      siparişiniz kargoya verildi. Teslimat genellikle 1-3 iş günü sürer.
    </p>
    <div style="padding:16px;background:#f6f6f4;">
      <div style="font-size:12px;letter-spacing:1px;color:#6b6b6b;">KARGO TAKİP NUMARASI</div>
      <div style="margin-top:6px;font-size:18px;font-weight:600;color:#111111;">${escapeHtml(trackingCode)}</div>
    </div>`;

  await send(order.email, `Siparişiniz kargoda — ${order.orderNo}`, layout("Siparişiniz kargoda", body));
}

export type { OrderEmailData };
