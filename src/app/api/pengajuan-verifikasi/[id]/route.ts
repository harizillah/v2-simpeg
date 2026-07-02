import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { createClient } from "@/lib/supabase/server";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Silakan login terlebih dahulu" }, { status: 401 });

  const { id } = await params;
  const svc = createServiceClient();
  const { data } = await svc.from("pengajuan_verifikasi").select("*, pegawai:pegawai!inner(nama_lengkap, nip)").eq("id", id).single();
  if (!data) return NextResponse.json({ error: "Pengajuan tidak ditemukan" }, { status: 404 });
  return NextResponse.json({ data });
}
