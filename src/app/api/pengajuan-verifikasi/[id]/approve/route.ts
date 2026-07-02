import { NextRequest, NextResponse } from "next/server";
import { approvePengajuan } from "@/lib/services/pengajuan";
import { createClient } from "@/lib/supabase/server";

export async function POST(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Silakan login terlebih dahulu" }, { status: 401 });

  const { id } = await params;
  const result = await approvePengajuan(Number(id), user.id);
  if (result.error) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json({ success: true, message: "Pengajuan disetujui dan data diperbarui" });
}
