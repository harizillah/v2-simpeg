import { NextRequest, NextResponse } from "next/server";
import { updatePendidikan, deletePendidikan } from "@/lib/services/riwayat";
import { createClient } from "@/lib/supabase/server";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; riwayatId: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Silakan login terlebih dahulu" }, { status: 401 });

  const { riwayatId } = await params;
  const body = await request.json();
  const result = await updatePendidikan(riwayatId, body);
  if (result.error) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json({ success: true, message: "Riwayat pendidikan berhasil diperbarui" });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; riwayatId: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Silakan login terlebih dahulu" }, { status: 401 });

  const { riwayatId } = await params;
  const result = await deletePendidikan(riwayatId);
  if (result.error) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json({ success: true, message: "Riwayat pendidikan berhasil dihapus" });
}
