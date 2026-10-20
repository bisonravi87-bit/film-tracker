import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import LogoutButton from "@/components/ui/LogoutButton";

const NAV = [
  { href: "/", label: "Inicio" },
  { href: "/directors", label: "Directores" },
  { href: "/genres", label: "Géneros" },
  { href: "/my-library", label: "Mi biblioteca" },
];

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  // Identidad del usuario para el panel (nombre guardado al registrarse).
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const nombre = (user?.user_metadata?.name as string | undefined) ?? user?.email;

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <nav className="mb-8 flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4">
        <Link href="/" className="text-xl font-extrabold">Film Tracker</Link>
        <div className="flex items-center gap-4">
          {NAV.map((item) => (
            <Link key={item.href} href={item.href} className="text-sm hover:text-stamp">{item.label}</Link>
          ))}
          <span className="hidden text-sm text-slate2 sm:inline">{nombre}</span>
          <LogoutButton />
        </div>
      </nav>
      {children}
    </div>
  );
}
