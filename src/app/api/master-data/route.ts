import { NextRequest, NextResponse } from "next/server";
import { getMasterData, createMasterData } from "@/lib/services/master-data";
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

function validate(table: string | null): table is MasterTable {
  return !!table && VALID_TABLES.includes(table as MasterTable);
}

async function auth(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { user: null, supabase: null };
  }
  return { user, supabase };
}

export async function GET(request: NextRequest) {
  const { user } = await auth(request);
  if (!user) {
    return NextResponse.json({ error: "Silakan login terlebih dahulu" }, { status: 401 });
  }

  const table = request.nextUrl.searchParams.get("table");
  if (!validate(table)) {
    return NextResponse.json({ error: "Parameter 'table' tidak valid" }, { status: 400 });
  }

  const result = await getMasterData(table);
  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  return NextResponse.json({ data: result.data });
}

export async function POST(request: NextRequest) {
  const { user } = await auth(request);
  if (!user) {
    return NextResponse.json({ error: "Silakan login terlebih dahulu" }, { status: 401 });
  }

  const table = request.nextUrl.searchParams.get("table");
  if (!validate(table)) {
    return NextResponse.json({ error: "Parameter 'table' tidak valid" }, { status: 400 });
  }

  const body = await request.json();
  const result = await createMasterData(table, body);
  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ success: true, data: result.data });
}
