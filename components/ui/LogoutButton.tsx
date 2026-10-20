"use client";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function LogoutButton() {
  const router = useRouter();
  return (
    <button
      type="button"
      aria-label="Cerrar sesión"
      title="Cerrar sesión"
      onClick={async () => {
        await createClient().auth.signOut();
        router.push("/login");
        router.refresh();
      }}
      className="flex min-h-9 min-w-9 items-center justify-center rounded-sm text-slate2 hover:text-stamp"
    >
      <LogOut size={16} aria-hidden />
    </button>
  );
}
