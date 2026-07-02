"use server";

import { createServiceClient } from "@/lib/supabase/service";
import { revalidatePath } from "next/cache";

// ============================================================
// Generic CRUD service untuk semua master data tabel
// ============================================================

export type MasterTable =
  | "golongan"
  | "status_pegawai"
  | "jabatan_fungsional"
  | "jabatan_rs"
  | "master_kategori_tenaga"
  | "master_jenis_tenaga"
  | "master_tingkat_pendidikan"
  | "master_universitas"
  | "master_jurusan"
  | "struktur_organisasi";

export async function getMasterData(table: MasterTable) {
  const supabase = createServiceClient();

  let query = supabase.from(table).select("*");

  if (table === "master_jenis_tenaga") {
    query = supabase
      .from(table)
      .select("*, master_kategori_tenaga!inner(nama)");
  }

  if (table === "struktur_organisasi") {
    query = supabase.from(table).select("*").order("urutan");
  }

  const { data, error } = await query;

  if (error) {
    return { error: error.message, data: null };
  }

  return { data, error: null };
}

export async function createMasterData(
  table: MasterTable,
  values: Record<string, unknown>
) {
  const supabase = createServiceClient();

  const { data, error } = await supabase.from(table).insert(values).select().single();

  if (error) {
    if (error.code === "23505") {
      return { error: "Data sudah ada", data: null };
    }
    return { error: error.message, data: null };
  }

  revalidatePath("/master-data");

  return { data, error: null };
}

export async function updateMasterData(
  table: MasterTable,
  id: number,
  values: Record<string, unknown>
) {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from(table)
    .update(values)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      return { error: "Data sudah ada", data: null };
    }
    return { error: error.message, data: null };
  }

  revalidatePath("/master-data");

  return { data, error: null };
}

export async function deleteMasterData(table: MasterTable, id: number) {
  const supabase = createServiceClient();

  const { error } = await supabase.from(table).delete().eq("id", id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/master-data");

  return { error: null };
}
