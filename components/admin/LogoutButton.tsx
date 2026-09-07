"use client";

import { logoutAction } from "@/app/admin/actions";

export function LogoutButton() {
  return (
    <form action={logoutAction}>
      <button
        type="submit"
        className="whitespace-nowrap px-3 py-2 text-sm text-ink-muted underline underline-offset-2 hover:text-ink"
      >
        Çıkış
      </button>
    </form>
  );
}
