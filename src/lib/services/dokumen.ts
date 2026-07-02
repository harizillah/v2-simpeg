"use server";

import { createServiceClient } from "@/lib/supabase/service";

// ============================================================
// Dokumen Pegawai Service — upload, download, signed URL
// ============================================================

const BUCKET = "dokumen-pegawai";
const MAX_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED_TYPES = ["application/pdf", "image/jpeg", "image/png"];

export function validateFile(file: { type: string; size: number }): string | null {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return "Hanya file PDF, JPG, dan PNG yang diizinkan";
  }
  if (file.size > MAX_SIZE) {
    return "Ukuran file maksimal 5 MB";
  }
  if (file.size === 0) {
    return "File kosong";
  }
  return null;
}

/** Upload dokumen pegawai */
export async function uploadDokumen(params: {
  pegawaiId: string;
  file: File;
  kategoriDokumen: string;
  namaDokumen: string;
  nomorDokumen?: string;
  tanggalDokumen?: string;
  tanggalBerakhir?: string;
  pengajuanVerifikasiId?: number;
  uploadedBy: string;
}) {
  const supabase = createServiceClient();

  const fileExt = params.file.name.split(".").pop() ?? "pdf";
  const filePath = `${params.pegawaiId}/${Date.now()}_${fileExt}`;

  // Upload ke storage
  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(filePath, params.file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (uploadError) {
    return { error: `Gagal mengunggah file: ${uploadError.message}`, data: null };
  }

  // Simpan metadata
  const { data, error } = await supabase
    .from("dokumen_pegawai")
    .insert({
      pegawai_id: params.pegawaiId,
      pengajuan_verifikasi_id: params.pengajuanVerifikasiId ?? null,
      kategori_dokumen: params.kategoriDokumen,
      nama_dokumen: params.namaDokumen,
      nomor_dokumen: params.nomorDokumen ?? null,
      tanggal_dokumen: params.tanggalDokumen ?? null,
      tanggal_berakhir: params.tanggalBerakhir ?? null,
      file_url: filePath,
      file_name: params.file.name,
      file_size: params.file.size,
      mime_type: params.file.type,
      uploaded_by: params.uploadedBy,
    })
    .select()
    .single();

  if (error) {
    // Rollback upload
    await supabase.storage.from(BUCKET).remove([filePath]);
    return { error: error.message, data: null };
  }

  return { data, error: null };
}

/** Dapatkan signed URL untuk download */
export async function getSignedUrl(filePath: string) {
  const supabase = createServiceClient();

  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(filePath, 300); // 5 menit

  if (error) {
    return { url: null, error: error.message };
  }

  return { url: data.signedUrl, error: null };
}

/** Nonaktifkan dokumen (soft delete) */
export async function nonaktifkanDokumen(id: string) {
  const supabase = createServiceClient();

  const { error } = await supabase
    .from("dokumen_pegawai")
    .update({ is_active: false })
    .eq("id", id);

  if (error) {
    return { error: error.message };
  }

  return { error: null };
}
