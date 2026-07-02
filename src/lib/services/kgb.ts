"use server";

import { createServiceClient } from "@/lib/supabase/service";
import type { Tables } from "@/types/database";

// ============================================================
// KGB (Kenaikan Gaji Berkala) Service
// Referensi: PRD §10.9, .claude/database.md
// ============================================================

type KgbStatus = "normal" | "warning" | "overdue" | "no_data";

/** Hitung TMT KGB berikutnya dari TMT KGB seharusnya */
function hitungKgbBerikutnya(tmtKgbSeharusnya: string | null): Date | null {
  if (!tmtKgbSeharusnya) return null;
  const tmt = new Date(tmtKgbSeharusnya);
  // Siklus KGB: 2 tahun
  const sekarang = new Date();
  let berikutnya = new Date(tmt);
  while (berikutnya <= sekarang) {
    berikutnya.setFullYear(berikutnya.getFullYear() + 2);
  }
  return berikutnya;
}

/** Tentukan status KGB dari TMT berikutnya */
function tentukanStatus(tmtBerikutnya: Date | null): { status: KgbStatus; tglBerikutnya: string | null } {
  if (!tmtBerikutnya) return { status: "no_data", tglBerikutnya: null };

  const sekarang = new Date();
  const tigaBulan = new Date(sekarang);
  tigaBulan.setMonth(sekarang.getMonth() + 3);

  if (tmtBerikutnya < sekarang) return { status: "overdue", tglBerikutnya: tmtBerikutnya.toISOString().split("T")[0] };
  if (tmtBerikutnya <= tigaBulan) return { status: "warning", tglBerikutnya: tmtBerikutnya.toISOString().split("T")[0] };
  return { status: "normal", tglBerikutnya: tmtBerikutnya.toISOString().split("T")[0] };
}

/** Ambil semua pegawai dengan status KGB (hanya PNS & PPPK) */
export async function getMonitoringKgb(filters?: {
  status?: KgbStatus;
  unitKerjaId?: number;
  page?: number;
  limit?: number;
}) {
  const supabase = createServiceClient();
  const page = filters?.page ?? 1;
  const limit = filters?.limit ?? 20;
  const offset = (page - 1) * limit;

  // Hanya PNS (1) dan PPPK (2)
  let query = supabase
    .from("pegawai")
    .select(
      `
      id, nama_lengkap, nip, status_kepegawaian_id, tmt_kgb, tmt_kgb_seharusnya,
      struktur:struktur_organisasi!pegawai_struktur_organisasi_id_fkey(nama),
      golongan:golongan!pegawai_golongan_id_fkey(nama, pangkat),
      status_pegawai:status_pegawai!pegawai_status_kepegawaian_id_fkey(nama)
    `,
      { count: "exact" }
    )
    .eq("is_deleted", false)
    .in("status_kepegawaian_id", [1, 2])
    .order("nama_lengkap");

  if (filters?.unitKerjaId) {
    query = query.eq("struktur_organisasi_id", filters.unitKerjaId);
  }

  const { data, error, count } = await query;

  if (error || !data) {
    return { data: null, error: error?.message ?? "Gagal memuat data KGB", count: 0 };
  }

  // Hitung status KGB client-side
  const result = data.map((p: typeof data[number]) => {
    const rujukan = p.tmt_kgb ?? p.tmt_kgb_seharusnya;
    const berikutnya = hitungKgbBerikutnya(rujukan);
    const { status, tglBerikutnya } = tentukanStatus(berikutnya);
    return { ...p, status_kgb: status, kgb_berikutnya: tglBerikutnya };
  });

  // Filter
  let filtered = result;
  if (filters?.status) {
    filtered = result.filter((r: { status_kgb: string }) => r.status_kgb === filters.status);
  }

  // Pagination
  const paginated = filtered.slice(offset, offset + limit);

  // Statistik
  const statistik = {
    total: filtered.length,
    normal: filtered.filter((r: { status_kgb: string }) => r.status_kgb === "normal").length,
    warning: filtered.filter((r: { status_kgb: string }) => r.status_kgb === "warning").length,
    overdue: filtered.filter((r: { status_kgb: string }) => r.status_kgb === "overdue").length,
    no_data: filtered.filter((r: { status_kgb: string }) => r.status_kgb === "no_data").length,
  };

  return { data: paginated, error: null, count: count ?? 0, statistik };
}

/** Detail status KGB satu pegawai */
export async function getKgbDetail(pegawaiId: string) {
  const supabase = createServiceClient();

  const { data: pegawai } = await supabase
    .from("pegawai")
    .select("id, nama_lengkap, nik, nip, tmt_kgb, tmt_kgb_seharusnya, tmt_pangkat, tmt_cpns")
    .eq("id", pegawaiId)
    .single();

  if (!pegawai) return { data: null, error: "Pegawai tidak ditemukan" };

  const { data: riwayatKgb } = await supabase
    .from("riwayat_kenaikan")
    .select("*, golongan_lama:golongan!riwayat_kenaikan_golongan_lama_id_fkey(nama, pangkat), golongan_baru:golongan!riwayat_kenaikan_golongan_baru_id_fkey(nama, pangkat)")
    .eq("pegawai_id", pegawaiId)
    .eq("jenis_kenaikan", "kgb")
    .order("tmt_kenaikan", { ascending: false });

  const rujukan = pegawai.tmt_kgb ?? pegawai.tmt_kgb_seharusnya;
  const berikutnya = hitungKgbBerikutnya(rujukan);
  const status = tentukanStatus(berikutnya);

  return {
    data: {
      pegawai,
      riwayatKgb: riwayatKgb ?? [],
      statusKgb: status,
    },
    error: null,
  };
}

/** Tambah riwayat KGB */
export async function tambahRiwayatKgb(data: {
  pegawaiId: string;
  golonganLamaId?: number;
  golonganBaruId?: number;
  tmtSeharusnya: string;
  tmtKenaikan?: string;
  isRetroaktif: boolean;
  keterangan?: string;
}) {
  const supabase = createServiceClient();

  const { error } = await supabase.from("riwayat_kenaikan").insert({
    pegawai_id: data.pegawaiId,
    jenis_kenaikan: "kgb",
    golongan_lama_id: data.golonganLamaId ?? null,
    golongan_baru_id: data.golonganBaruId ?? null,
    tmt_seharusnya: data.tmtSeharusnya,
    tmt_kenaikan: data.tmtKenaikan ?? null,
    is_retroaktif: data.isRetroaktif,
    keterangan: data.keterangan ?? null,
  });

  if (error) return { error: error.message };

  // Sinkronisasi ke pegawai.tmt_kgb
  if (data.tmtKenaikan) {
    await supabase.from("pegawai").update({ tmt_kgb: data.tmtKenaikan }).eq("id", data.pegawaiId);
  }
  await supabase.from("pegawai").update({ tmt_kgb_seharusnya: data.tmtSeharusnya }).eq("id", data.pegawaiId);

  return { error: null };
}
