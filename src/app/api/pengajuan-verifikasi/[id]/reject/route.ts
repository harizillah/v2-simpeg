import { NextRequest, NextResponse } from "next/server";
import { rejectPengajuan } from "@/lib/services/pengajuan";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Silakan login terlebih dahulu" }, { status: 401 });

  const { id } = await params;
  const { catatan } = await request.json();
  const result = await rejectPengajuan(Number(id), user.id, catatan || "Tidak ada catatan");
  if (result.error) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json({ success: true, message: "Pengajuan ditolak" });
}
