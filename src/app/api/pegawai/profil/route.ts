import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Silakan login terlebih dahulu" }, { status: 401 });

  const svc = createServiceClient();

  const { data: pegawai } = await svc
    .from("pegawai")
    .select("*, struktur:struktur_organisasi!pegawai_struktur_organisasi_id_fkey(nama), golongan:golongan!pegawai_golongan_id_fkey(nama, pangkat)")
    .eq("user_id", user.id)
    .eq("is_deleted", false)
    .single();

  if (!pegawai) return NextResponse.json({ error: "Data pegawai tidak ditemukan" }, { status: 404 });

  const { data: pengajuan } = await svc
    .from("pengajuan_verifikasi")
    .select("*")
    .eq("diajukan_oleh", user.id)
    .order("created_at", { ascending: false })
    .limit(10);

  return NextResponse.json({ data: { ...pegawai, pengajuan: pengajuan ?? [] } });
}
