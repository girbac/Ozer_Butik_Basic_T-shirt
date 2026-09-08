"use client";

import Link from "next/link";
import { useActionState } from "react";
import { loginAction } from "@/app/admin/actions";

export function LoginForm({ next }: { next: string }) {
  const [state, formAction, isPending] = useActionState(loginAction, {});

  return (
    <div className="container-page flex min-h-[70vh] items-center justify-center py-12">
      <form action={formAction} className="w-full max-w-sm">
        <h1 className="display text-center text-2xl">Yönetim Girişi</h1>

        <input type="hidden" name="next" value={next} />

        <label htmlFor="password" className="mt-8 block text-sm font-medium">
          Şifre
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          autoFocus
          aria-invalid={Boolean(state.error)}
          aria-describedby={state.error ? "login-error" : undefined}
          className={`mt-1.5 h-12 w-full border bg-bg px-3 ${
            state.error ? "border-danger" : "border-line"
          }`}
        />

        {state.error && (
          <p id="login-error" role="alert" className="mt-2 text-sm text-danger">
            {state.error}
          </p>
        )}

        <button type="submit" disabled={isPending} className="btn-primary mt-6 w-full">
          {isPending ? "Kontrol ediliyor…" : "Giriş Yap"}
        </button>

        <p className="mt-4 text-center text-xs text-ink-muted">
          Giriş yapamıyor musunuz?{" "}
          <Link href="/admin/durum" className="link-quiet text-ink">
            Kurulum durumunu kontrol edin
          </Link>
        </p>
      </form>
    </div>
  );
}
