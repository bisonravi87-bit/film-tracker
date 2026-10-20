"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [signUp, setSignUp] = useState(false);
  const [msg, setMsg] = useState("");

  async function submit() {
    const supabase = createClient();
    const { error } = signUp
      ? await supabase.auth.signUp({ email, password })
      : await supabase.auth.signInWithPassword({ email, password });
    if (error) return setMsg(error.message);
    if (signUp) return setMsg("Revisa tu correo para confirmar la cuenta.");
    router.push("/directors"); router.refresh();
  }

  return (
    <main className="mx-auto mt-24 max-w-sm space-y-4 px-4">
      <h1 className="text-3xl font-bold">{signUp ? "Crear cuenta" : "Entrar"}</h1>
      <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Correo"
        aria-label="Correo" className="w-full rounded-sm border border-line bg-white px-3 py-2" />
      <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Contraseña"
        aria-label="Contraseña" className="w-full rounded-sm border border-line bg-white px-3 py-2" />
      {msg && <p role="alert" className="text-sm text-stamp">{msg}</p>}
      <button onClick={submit} className="w-full rounded-sm bg-ink py-2 text-paper">{signUp ? "Crear cuenta" : "Entrar"}</button>
      <button onClick={() => { setSignUp(!signUp); setMsg(""); }} className="text-sm underline">
        {signUp ? "Ya tengo cuenta" : "No tengo cuenta"}
      </button>
    </main>
  );
}
