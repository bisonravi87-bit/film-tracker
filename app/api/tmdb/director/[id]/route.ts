import { NextResponse } from "next/server";
import { getDirectorFilmography } from "@/lib/tmdb";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try { return NextResponse.json(await getDirectorFilmography(id)); }
  catch { return NextResponse.json({ error: "Director no encontrado" }, { status: 404 }); }
}
