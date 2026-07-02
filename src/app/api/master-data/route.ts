import { NextRequest, NextResponse } from "next/server";
import { getMasterData } from "@/lib/services/master-data";
import type { MasterTable } from "@/lib/services/master-data";
import { createClient } from "@/lib/supabase/server";

const VALID_TABLES: MasterTable[] = [
  "golongan",
  "status_pegawai",
  "jabatan_fungsional",
  "jabatan_rs",
  "master_kategori_tenaga",
  "master_jenis_tenaga",
  "master_tingkat_pendidikan",
  "master_universitas",
  "master_jurusan",
  "struktur_organisasi",
];

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Silakan login terlebih dahulu" }, { status: 401 });
  }

  const { searchParams } = request.nextUrl;
  const table = searchParams.get("table") as MasterTable | null;

  if (!table || !VALID_TABLES.includes(table)) {
    return NextResponse.json(
      { error: "Parameter 'table' tidak valid" },
      { status: 400 }
    );
  }

  const result = await getMasterData(table);

  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  return NextResponse.json({ data: result.data });
}
