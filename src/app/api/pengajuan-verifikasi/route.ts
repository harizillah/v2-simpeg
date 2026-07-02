import { NextRequest, NextResponse } from "next/server";
import { getPengajuanList, createPengajuan } from "@/lib/services/pengajuan";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Silakan login terlebih dahulu" }, { status: 401 });

  const sp = request.nextUrl.searchParams;
  const result = await getPengajuanList({ status: sp.get("status") || undefined, page: Number(sp.get("page")) || 1, limit: Number(sp.get("limit")) || 20 });
  if (result.error) return NextResponse.json({ error: result.error }, { status: 500 });
  return NextResponse.json({ data: result.data, count: result.count });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Silakan login terlebih dahulu" }, { status: 401 });

  const body = await request.json();
  const result = await createPengajuan({ ...body, diajukanOleh: user.id });
  if (result.error) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json({ success: true, message: "Pengajuan berhasil dikirim" });
}
