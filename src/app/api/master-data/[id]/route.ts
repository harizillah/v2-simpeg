import { NextRequest, NextResponse } from "next/server";
import { updateMasterData, deleteMasterData, type MasterTable } from "@/lib/services/master-data";
import { createClient } from "@/lib/supabase/server";

const VALID_TABLES: MasterTable[] = [
  "golongan", "status_pegawai", "jabatan_fungsional", "jabatan_rs",
  "master_kategori_tenaga", "master_jenis_tenaga",
  "master_tingkat_pendidikan", "master_universitas", "master_jurusan",
  "struktur_organisasi",
];

function valid(t: string | null): t is MasterTable {
  return !!t && VALID_TABLES.includes(t as MasterTable);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Silakan login terlebih dahulu" }, { status: 401 });

  const { id } = await params;
  const table = request.nextUrl.searchParams.get("table");
  if (!valid(table)) return NextResponse.json({ error: "Parameter table tidak valid" }, { status: 400 });

  const body = await request.json();
  const result = await updateMasterData(table, Number(id), body);
  if (result.error) return NextResponse.json({ error: result.error }, { status: 400 });

  return NextResponse.json({ success: true, data: result.data });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Silakan login terlebih dahulu" }, { status: 401 });

  const { id } = await params;
  const table = request.nextUrl.searchParams.get("table");
  if (!valid(table)) return NextResponse.json({ error: "Parameter table tidak valid" }, { status: 400 });

  const result = await deleteMasterData(table, Number(id));
  if (result.error) return NextResponse.json({ error: result.error }, { status: 400 });

  return NextResponse.json({ success: true });
}
