"use server";

import { createServiceClient } from "@/lib/supabase/service";

// ---- Pendidikan ----
export async function createPendidikan(data: {
  pegawaiId: string;
  tingkatPendidikanId?: number;
  namaUniversitas?: string;
  universitasId?: number;
  namaJurusan?: string;
  jurusanId?: number;
  tahunLulus?: number;
  nomorIjazah?: string;
}) {
  const supabase = createServiceClient();
  const { error } = await supabase.from("riwayat_pendidikan").insert({
    pegawai_id: data.pegawaiId,
    tingkat_pendidikan_id: data.tingkatPendidikanId ?? null,
    nama_universitas: data.namaUniversitas ?? null,
    universitas_id: data.universitasId ?? null,
    nama_jurusan: data.namaJurusan ?? null,
    jurusan_id: data.jurusanId ?? null,
    tahun_lulus: data.tahunLulus ?? null,
    nomor_ijazah: data.nomorIjazah ?? null,
  });
  if (error) return { error: error.message };
  return { error: null };
}

export async function updatePendidikan(id: string, data: Record<string, unknown>) {
  const supabase = createServiceClient();
  const { error } = await supabase.from("riwayat_pendidikan").update(data).eq("id", id);
  if (error) return { error: error.message };
  return { error: null };
}

export async function deletePendidikan(id: string) {
  const supabase = createServiceClient();
  const { error } = await supabase.from("riwayat_pendidikan").delete().eq("id", id);
  if (error) return { error: error.message };
  return { error: null };
}

// ---- Jabatan RS ----
export async function createJabatanRS(data: {
  pegawaiId: string;
  jabatanRsId: number;
  tmtJabatan?: string;
  keterangan?: string;
}) {
  const supabase = createServiceClient();
  const { error } = await supabase.from("pegawai_jabatan_rs").insert({
    pegawai_id: data.pegawaiId,
    jabatan_rs_id: data.jabatanRsId,
    tmt_jabatan: data.tmtJabatan ?? null,
    keterangan: data.keterangan ?? null,
  });
  if (error) return { error: error.message };
  return { error: null };
}

export async function deleteJabatanRS(id: number) {
  const supabase = createServiceClient();
  const { error } = await supabase.from("pegawai_jabatan_rs").delete().eq("id", id);
  if (error) return { error: error.message };
  return { error: null };
}
