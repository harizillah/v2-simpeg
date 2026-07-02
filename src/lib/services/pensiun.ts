"use server";

import { createServiceClient } from "@/lib/supabase/service";
import { hitungUsia } from "@/lib/helpers/format";

// ============================================================
// Pensiun & BUP Service
// Referensi: PRD §10.12
// ============================================================

const ATURAN_BUP: Record<string, number> = {
  "Ahli Utama": 65,
  "Ahli Madya": 60,
  "Eselon I": 60,
  "Eselon II": 60,
  default: 58,
};

function tentukanBup(jabatan: string | null, eselon: string | null): number {
  if (jabatan && ATURAN_BUP[jabatan]) return ATURAN_BUP[jabatan];
  if (eselon && ATURAN_BUP[eselon]) return ATURAN_BUP[eselon];
  return ATURAN_BUP.default;
}

function hitungTanggalPensiun(tanggalLahir: string, bup: number): Date {
  const tgl = new Date(tanggalLahir);
  tgl.setFullYear(tgl.getFullYear() + bup);
  tgl.setDate(tgl.getDate() + 1); // BUP = mulai bulan berikutnya setelah ulang tahun ke-N
  return tgl;
}

export async function getLaporanPensiun(filters?: {
  tahun?: number;
  unitKerjaId?: number;
  page?: number;
  limit?: number;
}) {
  const supabase = createServiceClient();
  const page = filters?.page ?? 1;
  const limit = filters?.limit ?? 20;
  const offset = (page - 1) * limit;

  let query = supabase
    .from("pegawai")
    .select(
      `
      id, nama_lengkap, nip, tanggal_lahir,
      jabatan_fungsional!pegawai_jabatan_fungsional_id_fkey(nama, jenis),
      eselon,
      struktur:struktur_organisasi!pegawai_struktur_organisasi_id_fkey(nama),
      golongan:golongan!pegawai_golongan_id_fkey(nama)
    `,
      { count: "exact" }
    )
    .eq("is_deleted", false)
    .not("tanggal_lahir", "is", null);

  if (filters?.unitKerjaId) {
    query = query.eq("struktur_organisasi_id", filters.unitKerjaId);
  }

  const { data, error, count } = await query;

  if (error || !data) {
    return { data: null, error: error?.message ?? "Gagal memuat data pensiun", count: 0 };
  }

  // Hitung BUP & tanggal pensiun
  const result = data.map((p: typeof data[number]) => {
    const usia = hitungUsia(p.tanggal_lahir!);
    const jabatanNama = (p.jabatan_fungsional as { nama?: string; jenis?: string } | null)?.jenis ?? null;
    const bup = tentukanBup(jabatanNama, p.eselon);
    const tglPensiun = hitungTanggalPensiun(p.tanggal_lahir!, bup);
    const tahunPensiun = tglPensiun.getFullYear();

    return {
      ...p,
      usia,
      bup,
      tgl_pensiun: tglPensiun.toISOString().split("T")[0],
      tahun_pensiun: tahunPensiun,
    };
  });

  // Filter tahun
  let filtered = result;
  if (filters?.tahun) {
    filtered = result.filter((r: { tahun_pensiun: number }) => r.tahun_pensiun === filters.tahun);
  }

  // Sort: terdekat dulu
  filtered.sort((a: { tgl_pensiun: string }, b: { tgl_pensiun: string }) => a.tgl_pensiun.localeCompare(b.tgl_pensiun));

  const paginated = filtered.slice(offset, offset + limit);

  // Statistik
  const sekarang = new Date();
  const duaBelasBulan = new Date(sekarang);
  duaBelasBulan.setMonth(sekarang.getMonth() + 12);

  const mendekati = filtered.filter((r: { tgl_pensiun: string }) => {
    const tgl = new Date(r.tgl_pensiun);
    return tgl <= duaBelasBulan && tgl >= sekarang;
  });

  return {
    data: paginated,
    error: null,
    count: count ?? 0,
    statistik: {
      total: filtered.length,
      mendekati: mendekati.length,
      dalam12Bulan: mendekati,
    },
  };
}
