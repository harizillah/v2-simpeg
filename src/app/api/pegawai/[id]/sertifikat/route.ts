import { NextRequest, NextResponse } from "next/server";
import { createSertifikat } from "@/lib/services/sertifikat";
import { createClient } from "@/lib/supabase/server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Silakan login terlebih dahulu" }, { status: 401 });

  const { id: pegawaiId } = await params;
  const body = await request.json();
  const result = await createSertifikat({ pegawaiId, ...body });
  if (result.error) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json({ success: true, message: "Sertifikat berhasil ditambahkan" });
}
