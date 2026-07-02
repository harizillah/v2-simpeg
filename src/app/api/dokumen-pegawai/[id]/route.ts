import { NextRequest, NextResponse } from "next/server";
import { getSignedUrl, nonaktifkanDokumen } from "@/lib/services/dokumen";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Silakan login terlebih dahulu" }, { status: 401 });

  const { id } = await params;
  const svc = createServiceClient();
  const { data: dok } = await svc.from("dokumen_pegawai").select("file_url").eq("id", id).single();
  if (!dok) return NextResponse.json({ error: "Dokumen tidak ditemukan" }, { status: 404 });

  const { url, error } = await getSignedUrl(dok.file_url);
  if (error || !url) return NextResponse.json({ error: error || "Gagal membuat URL" }, { status: 500 });
  return NextResponse.redirect(url);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Silakan login terlebih dahulu" }, { status: 401 });

  const { id } = await params;
  const result = await nonaktifkanDokumen(id);
  if (result.error) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json({ success: true, message: "Dokumen berhasil dinonaktifkan" });
}
