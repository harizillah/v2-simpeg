import { NextRequest, NextResponse } from "next/server";
import { softDeletePegawai } from "@/lib/services/pegawai";
import { createClient } from "@/lib/supabase/server";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Silakan login terlebih dahulu" }, { status: 401 });
  }

  const { id } = await params;

  const { data: profile } = await supabase
    .from("profiles")
    .select("nama_lengkap")
    .eq("id", user.id)
    .single();

  const result = await softDeletePegawai(
    id,
    user.id,
    profile?.nama_lengkap ?? user.email ?? "Unknown"
  );

  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ success: true, message: "Pegawai berhasil dinonaktifkan" });
}
