"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function traducir(mensaje: string): string {
  if (/invalid login credentials/i.test(mensaje)) return "Correo o contraseña incorrectos.";
  if (/not confirmed/i.test(mensaje)) return "La cuenta existe pero sin confirmar. Revisa tu correo.";
  if (/rate limit/i.test(mensaje)) return "Demasiados intentos. Espera un minuto y vuelve a probar.";
  return mensaje;
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setMsg("");
    setBusy(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) { setBusy(false); return setMsg(traducir(error.message)); }
    router.push("/");
    router.refresh();
  }

  return (
    <main className="mx-auto mt-16 max-w-sm space-y-4 px-4">
      <h1 className="text-3xl font-bold">Entrar</h1>
      <form onSubmit={submit} className="space-y-3">
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Correo"
          aria-label="Correo" autoComplete="email" required
          className="w-full rounded-sm border border-line bg-white px-3 py-2" />
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Contraseña"
          aria-label="Contraseña" autoComplete="current-password" required
          className="w-full rounded-sm border border-line bg-white px-3 py-2" />
        {msg && <p role="alert" className="text-sm text-stamp">{msg}</p>}
        <button type="submit" disabled={busy}
          className="w-full rounded-sm bg-ink py-2.5 text-paper hover:bg-stamp disabled:opacity-60">
          {busy ? "Entrando…" : "Entrar"}
        </button>
      </form>
      <p className="text-center text-sm">
        ¿Aún no tienes cuenta? <Link href="/register" className="underline hover:text-stamp">Crear cuenta</Link>
      </p>
    </main>
  );
}
