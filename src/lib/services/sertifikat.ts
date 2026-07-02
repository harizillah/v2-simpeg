"use server";

import { createServiceClient } from "@/lib/supabase/service";

export async function createSertifikat(data: {
  pegawaiId: string;
  jenisSertifikat: string;
  namaKegiatan: string;
  tmtKegiatan?: string;
  jumlahJam?: number;
  penyedia?: string;
  lokasi?: string;
  berlakuHingga?: string;
}) {
  const supabase = createServiceClient();
  const { error } = await supabase.from("pegawai_sertifikat").insert({
    pegawai_id: data.pegawaiId,
    jenis_sertifikat: data.jenisSertifikat,
    nama_kegiat_an: data.namaKegiatan,
    tmt_kegiat_an: data.tmtKegiatan ?? null,
    jumlah_jam: data.jumlahJam ?? null,
    penyedia: data.penyedia ?? null,
    lokasi: data.lokasi ?? null,
    berlaku_hingga: data.berlakuHingga ?? null,
  });
  if (error) return { error: error.message };
  return { error: null };
}

export async function deleteSertifikat(id: string) {
  const supabase = createServiceClient();
  const { error } = await supabase.from("pegawai_sertifikat").delete().eq("id", id);
  if (error) return { error: error.message };
  return { error: null };
}

export async function getMonitoringStrSip() {
  const supabase = createServiceClient();
  const enamBulanLagi = new Date();
  enamBulanLagi.setMonth(enamBulanLagi.getMonth() + 6);
  const now = enamBulanLagi.toISOString().split("T")[0];
  const today = new Date().toISOString().split("T")[0];

  const { data: akanKedaluwarsa } = await supabase
    .from("pegawai_sertifikat")
    .select("*, pegawai:pegawai!inner(nama_lengkap, nip, struktur:struktur_organisasi!pegawai_struktur_organisasi_id_fkey(nama))")
    .in("jenis_sertifikat", ["STR", "SIP"])
    .not("berlaku_hingga", "is", null)
    .lte("berlaku_hingga", now)
    .gte("berlaku_hingga", today)
    .order("berlaku_hingga");

  const { data: sudahKedaluwarsa } = await supabase
    .from("pegawai_sertifikat")
    .select("*, pegawai:pegawai!inner(nama_lengkap, nip, struktur:struktur_organisasi!pegawai_struktur_organisasi_id_fkey(nama))")
    .in("jenis_sertifikat", ["STR", "SIP"])
    .not("berlaku_hingga", "is", null)
    .lt("berlaku_hingga", today)
    .order("berlaku_hingga");

  return {
    akanKedaluwarsa: akanKedaluwarsa ?? [],
    sudahKedaluwarsa: sudahKedaluwarsa ?? [],
    error: null,
  };
}
