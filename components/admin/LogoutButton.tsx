"use client";

import { logoutAction } from "@/app/admin/actions";

export function LogoutButton() {
  return (
    <form action={logoutAction}>
      <button
        type="submit"
        className="link-quiet whitespace-nowrap px-3 py-2 text-sm text-ink-muted"
      >
        Çıkış
      </button>
    </form>
  );
}
