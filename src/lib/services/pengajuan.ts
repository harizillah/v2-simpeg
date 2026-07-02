"use server";

import { createServiceClient } from "@/lib/supabase/service";
import { logPegawaiChange } from "@/lib/helpers/audit";
import { revalidatePath } from "next/cache";

export async function getPengajuanList(filter: { status?: string; page?: number; limit?: number }) {
  const supabase = createServiceClient();
  const page = filter.page ?? 1;
  const limit = filter.limit ?? 20;

  let query = supabase
    .from("pengajuan_verifikasi")
    .select("*, pegawai:pegawai!inner(nama_lengkap, nip)", { count: "exact" })
    .order("created_at", { ascending: false })
    .range((page - 1) * limit, page * limit - 1);

  if (filter.status) query = query.eq("status", filter.status);

  const { data, error, count } = await query;
  if (error) return { data: null, error: error.message, count: 0 };
  return { data, error: null, count: count ?? 0 };
}

export async function createPengajuan(data: {
  pegawaiId: string;
  jenisPerubahan: string;
  dataLama: Record<string, unknown>;
  dataBaru: Record<string, unknown>;
  diajukanOleh: string;
}) {
  const supabase = createServiceClient();
  const { error } = await supabase.from("pengajuan_verifikasi").insert({
    pegawai_id: data.pegawaiId,
    jenis_perubahan: data.jenisPerubahan,
    data_lama: data.dataLama,
    data_baru: data.dataBaru,
    status: "pending",
    diajukan_oleh: data.diajukanOleh,
  });
  if (error) return { error: error.message };
  return { error: null };
}

export async function approvePengajuan(id: number, diverifikasiOleh: string) {
  const supabase = createServiceClient();

  const { data: pengajuan } = await supabase
    .from("pengajuan_verifikasi")
    .select("*, pegawai!inner(nama_lengkap)").eq("id", id).single();

  if (!pengajuan) return { error: "Pengajuan tidak ditemukan" };

  // Update status
  const { error: updateError } = await supabase
    .from("pengajuan_verifikasi")
    .update({ status: "diterima", diverifikasi_oleh: diverifikasiOleh, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (updateError) return { error: updateError.message };

  // Apply changes to pegawai
  const dataBaru = pengajuan.data_baru as Record<string, unknown>;
  const { error: applyError } = await supabase
    .from("pegawai")
    .update(dataBaru)
    .eq("id", pengajuan.pegawai_id);

  if (applyError) return { error: applyError.message };

  // Audit
  await logPegawaiChange({
    pegawaiId: pengajuan.pegawai_id,
    changeType: "UPDATE",
    fieldName: pengajuan.jenis_perubahan,
    newValue: JSON.stringify(dataBaru),
    changedBy: diverifikasiOleh,
  });

  revalidatePath("/verifikasi");
  return { error: null };
}

export async function rejectPengajuan(id: number, diverifikasiOleh: string, catatan: string) {
  const supabase = createServiceClient();

  const { error } = await supabase
    .from("pengajuan_verifikasi")
    .update({ status: "ditolak", diverifikasi_oleh: diverifikasiOleh, catatan, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) return { error: error.message };
  revalidatePath("/verifikasi");
  return { error: null };
}
