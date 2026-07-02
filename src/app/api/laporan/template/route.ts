import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Silakan login terlebih dahulu" }, { status: 401 });

  const svc = createServiceClient();
  const { data } = await svc.from("template_laporan").select("*").eq("is_active", true).order("jenis_laporan");
  return NextResponse.json({ data: data ?? [] });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Silakan login terlebih dahulu" }, { status: 401 });

  const body = await request.json();
  const svc = createServiceClient();
  const { error } = await svc.from("template_laporan").insert({
    nama: body.nama,
    jenis_laporan: body.jenis_laporan,
    konfigurasi: body.konfigurasi || {},
    is_default: false,
    created_by: user.id,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ success: true, message: "Template berhasil disimpan" });
}
