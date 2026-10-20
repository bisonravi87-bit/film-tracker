import { NextResponse } from "next/server";
import { searchPeople } from "@/lib/tmdb";

export async function GET(req: Request) {
  const q = new URL(req.url).searchParams.get("q")?.trim();
  if (!q) return NextResponse.json([]);
  try { return NextResponse.json(await searchPeople(q)); }
  catch { return NextResponse.json({ error: "No se pudo buscar en TMDB" }, { status: 502 }); }
}
