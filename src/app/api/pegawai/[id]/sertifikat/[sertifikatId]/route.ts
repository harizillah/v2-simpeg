import { NextRequest, NextResponse } from "next/server";
import { deleteSertifikat } from "@/lib/services/sertifikat";
import { createClient } from "@/lib/supabase/server";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; sertifikatId: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Silakan login terlebih dahulu" }, { status: 401 });

  const { sertifikatId } = await params;
  const result = await deleteSertifikat(sertifikatId);
  if (result.error) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json({ success: true, message: "Sertifikat berhasil dihapus" });
}
