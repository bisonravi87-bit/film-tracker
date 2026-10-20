"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

/** Traduce los mensajes de error de Supabase a algo comprensible. */
function traducir(mensaje: string): string {
  if (/already registered/i.test(mensaje)) return "Ese correo ya está registrado. Inicia sesión.";
  if (/invalid email/i.test(mensaje)) return "El correo no tiene un formato válido.";
  if (/password.*least|should be/i.test(mensaje)) return "La contraseña debe tener al menos 8 caracteres.";
  if (/rate limit/i.test(mensaje)) return "Demasiados intentos. Espera un minuto y vuelve a probar.";
  return mensaje;
}

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  const progreso = password.length >= 8 ? 1 : Math.min(password.length / 8, 0.9);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setMsg("");
    if (!name.trim()) return setMsg("Escribe un nombre (es tu perfil en la app).");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return setMsg("El correo no tiene un formato válido.");
    if (password.length < 8) return setMsg("La contraseña debe tener al menos 8 caracteres.");
    if (password !== password2) return setMsg("Las contraseñas no coinciden.");

    setBusy(true);
    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email, password,
      options: { data: { name: name.trim() } },
    });
    if (error) { setBusy(false); return setMsg(traducir(error.message)); }

    // Con confirmación de correo desactivada, SignUp devuelve sesión: entra directamente.
    if (data.session) {
      router.push("/");
      router.refresh();
    } else {
      setBusy(false);
      setMsg("Cuenta creada. Revisa tu correo para confirmarla y luego inicia sesión.");
    }
  }

  return (
    <main className="mx-auto mt-16 max-w-sm space-y-4 px-4">
      <h1 className="text-3xl font-bold">Crear cuenta</h1>
      <p className="text-sm text-slate2">Un perfil por persona: cada uno tacha sus propias películas.</p>
      <form onSubmit={submit} className="space-y-3">
        <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Tu nombre, p. ej. Marta"
          aria-label="Nombre" autoComplete="name" maxLength={60}
          className="w-full rounded-sm border border-line bg-white px-3 py-2" />
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Correo"
          aria-label="Correo" autoComplete="email" required
          className="w-full rounded-sm border border-line bg-white px-3 py-2" />
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Contraseña (mín. 8 caracteres)"
          aria-label="Contraseña" autoComplete="new-password" required
          className="w-full rounded-sm border border-line bg-white px-3 py-2" />
        <div className="h-1.5 overflow-hidden rounded-sm bg-line" aria-hidden>
          <div className="h-full bg-stamp transition-[width]" style={{ width: `${progreso * 100}%` }} />
        </div>
        <input type="password" value={password2} onChange={(e) => setPassword2(e.target.value)} placeholder="Repite la contraseña"
          aria-label="Repite la contraseña" autoComplete="new-password" required
          className="w-full rounded-sm border border-line bg-white px-3 py-2" />
        {msg && <p role="alert" className="text-sm text-stamp">{msg}</p>}
        <button type="submit" disabled={busy}
          className="w-full rounded-sm bg-ink py-2.5 text-paper hover:bg-stamp disabled:opacity-60">
          {busy ? "Creando cuenta…" : "Crear cuenta"}
        </button>
      </form>
      <p className="text-center text-sm">
        ¿Ya tienes cuenta? <Link href="/login" className="underline hover:text-stamp">Inicia sesión</Link>
      </p>
    </main>
  );
}
