"use server";

import { createServiceClient } from "@/lib/supabase/service";
import { logPegawaiChange } from "@/lib/helpers/audit";
import { revalidatePath } from "next/cache";
import type { PegawaiFormValues } from "@/lib/validators/pegawai";
import type { Tables } from "@/types/database";

export type PegawaiRow = Tables<"pegawai">;

// ============================================================
// GET list pegawai dengan filter, search, pagination
// ============================================================

export interface PegawaiFilter {
  search?: string;
  statusKepegawaianId?: number;
  strukturOrganisasiId?: number;
  jenisTenagaId?: number;
  golonganId?: number;
  isDeleted?: boolean; // default: false (aktif saja)
  page?: number;
  limit?: number;
}

export async function getPegawaiList(filter: PegawaiFilter = {}) {
  const supabase = createServiceClient();

  const page = filter.page ?? 1;
  const limit = filter.limit ?? 10;
  const offset = (page - 1) * limit;
  const showDeleted = filter.isDeleted ?? false;

  let query = supabase
    .from("pegawai")
    .select(
      `
      *,
      status_kepegawaian:status_pegawai!pegawai_status_kepegawaian_id_fkey(nama),
      struktur:struktur_organisasi!pegawai_struktur_organisasi_id_fkey(nama),
      golongan:golongan!pegawai_golongan_id_fkey(nama, pangkat),
      jenis_tenaga:master_jenis_tenaga!pegawai_jenis_tenaga_id_fkey(nama)
    `,
      { count: "exact" }
    )
    .eq("is_deleted", showDeleted)
    .order("nama_lengkap");

  if (filter.search) {
    const searchTerm = `%${filter.search}%`;
    query = query.or(
      `nama_lengkap.ilike.${searchTerm},nik.ilike.${searchTerm},nip.ilike.${searchTerm}`
    );
  }

  if (filter.statusKepegawaianId) {
    query = query.eq("status_kepegawaian_id", filter.statusKepegawaianId);
  }

  if (filter.strukturOrganisasiId) {
    query = query.eq("struktur_organisasi_id", filter.strukturOrganisasiId);
  }

  if (filter.jenisTenagaId) {
    query = query.eq("jenis_tenaga_id", filter.jenisTenagaId);
  }

  if (filter.golonganId) {
    query = query.eq("golongan_id", filter.golonganId);
  }

  const { data, error, count } = await query.range(offset, offset + limit - 1);

  if (error) {
    return { data: null, error: error.message, count: 0 };
  }

  return { data, error: null, count: count ?? 0 };
}

// ============================================================
// GET detail pegawai by ID
// ============================================================

export async function getPegawaiDetail(id: string) {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("pegawai")
    .select(
      `
      *,
      status_kepegawaian:status_pegawai!pegawai_status_kepegawaian_id_fkey(*),
      struktur:struktur_organisasi!pegawai_struktur_organisasi_id_fkey(*),
      golongan:golongan!pegawai_golongan_id_fkey(*),
      golongan_cpns:golongan!pegawai_golongan_cpns_id_fkey(*),
      jabatan_fungsional(*),
      jenis_tenaga:master_jenis_tenaga!pegawai_jenis_tenaga_id_fkey(*)
    `
    )
    .eq("id", id)
    .single();

  if (error) {
    return { data: null, error: error.message };
  }

  // Ambil relasi tambahan
  const [{ data: riwayatPendidikan }, { data: jabatanRs }, { data: sertifikat }, { data: riwayatKenaikan }, { data: dokumen }, { data: auditLog }] =
    await Promise.all([
      supabase
        .from("riwayat_pendidikan")
        .select("*, tingkat:master_tingkat_pendidikan(nama)")
        .eq("pegawai_id", id)
        .order("tahun_lulus", { ascending: false }),
      supabase
        .from("pegawai_jabatan_rs")
        .select("*, jabatan_rs:nama")
        .eq("pegawai_id", id)
        .order("created_at", { ascending: false }),
      supabase
        .from("pegawai_sertifikat")
        .select("*")
        .eq("pegawai_id", id)
        .order("created_at", { ascending: false }),
      supabase
        .from("riwayat_kenaikan")
        .select("*, golongan_lama:golongan!riwayat_kenaikan_golongan_lama_id_fkey(nama, pangkat), golongan_baru:golongan!riwayat_kenaikan_golongan_baru_id_fkey(nama, pangkat)")
        .eq("pegawai_id", id)
        .order("created_at", { ascending: false }),
      supabase
        .from("dokumen_pegawai")
        .select("*")
        .eq("pegawai_id", id)
        .eq("is_active", true)
        .order("created_at", { ascending: false }),
      supabase
        .from("pegawai_audit_log")
        .select("*")
        .eq("pegawai_id", id)
        .order("created_at", { ascending: false })
        .limit(50),
    ]);

  return {
    data: {
      ...data,
      riwayat_pendidikan: riwayatPendidikan ?? [],
      pegawai_jabatan_rs: jabatanRs ?? [],
      pegawai_sertifikat: sertifikat ?? [],
      riwayat_kenaikan: riwayatKenaikan ?? [],
      dokumen_pegawai: dokumen ?? [],
      pegawai_audit_log: auditLog ?? [],
    },
    error: null,
  };
}

// ============================================================
// CREATE pegawai (+ akun opsional)
// ============================================================

export async function createPegawai(
  values: PegawaiFormValues,
  createdBy: string,
  createdByName: string
) {
  const supabase = createServiceClient();

  let userId: string | null = null;

  // 1. Buat akun auth jika diminta
  if (values.buat_akun && values.email && values.password) {
    const { data: authData, error: authError } =
      await supabase.auth.admin.createUser({
        email: values.email,
        password: values.password,
        email_confirm: true,
      });

    if (authError) {
      return { error: `Gagal membuat akun: ${authError.message}`, data: null };
    }

    userId = authData.user.id;

    // Set role ke pegawai
    await supabase
      .from("profiles")
      .update({ role_id: 3 })
      .eq("id", userId);
  }

  // 2. Insert pegawai
  const pegawaiData = {
    nik: values.nik || null,
    nip: values.nip || null,
    nama_lengkap: values.nama_lengkap,
    email: values.email || null,
    no_kk: values.no_kk || null,
    tempat_lahir: values.tempat_lahir || null,
    tanggal_lahir: values.tanggal_lahir || null,
    jenis_kelamin: values.jenis_kelamin as string | null,
    agama: values.agama || null,
    status_pernikahan: values.status_pernikahan || null,
    alamat: values.alamat || null,
    telepon: values.telepon || null,
    status_kepegawaian_id: values.status_kepegawaian_id ?? null,
    struktur_organisasi_id: values.struktur_organisasi_id ?? null,
    jabatan_fungsional_id: values.jabatan_fungsional_id ?? null,
    jenis_tenaga_id: values.jenis_tenaga_id ?? null,
    eselon: values.eselon || null,
    golongan_id: values.golongan_id ?? null,
    golongan_cpns_id: values.golongan_cpns_id ?? null,
    tmt_pangkat: values.tmt_pangkat || null,
    tmt_jabatan: values.tmt_jabatan || null,
    tmt_cpns: values.tmt_cpns || null,
    tmt_awal: values.tmt_awal || null,
    tmt_akhir: values.tmt_akhir || null,
    tmt_kgb: values.tmt_kgb || null,
    tmt_kgb_seharusnya: values.tmt_kgb_seharusnya || null,
    is_tenaga_medis: values.is_tenaga_medis,
    wajib_str: values.wajib_str,
    wajib_sip: values.wajib_sip,
    user_id: userId,
  };

  const { data, error } = await supabase
    .from("pegawai")
    .insert(pegawaiData)
    .select()
    .single();

  if (error) {
    // Rollback: hapus user jika gagal insert pegawai
    if (userId) {
      await supabase.auth.admin.deleteUser(userId);
    }
    if (error.code === "23505") {
      return { error: "NIK atau NIP sudah terdaftar", data: null };
    }
    return { error: error.message, data: null };
  }

  // 3. Audit log
  await logPegawaiChange({
    pegawaiId: data.id,
    changeType: "INSERT",
    changedBy: createdBy,
    changedByName: createdByName,
  });

  revalidatePath("/pegawai");

  return { data, error: null };
}

// ============================================================
// UPDATE pegawai
// ============================================================

export async function updatePegawai(
  id: string,
  values: PegawaiFormValues,
  changedBy: string,
  changedByName: string
) {
  const supabase = createServiceClient();

  // Ambil data lama untuk audit
  const { data: oldData } = await supabase
    .from("pegawai")
    .select("*")
    .eq("id", id)
    .single();

  const updateData = {
    nik: values.nik || null,
    nip: values.nip || null,
    nama_lengkap: values.nama_lengkap,
    email: values.email || null,
    no_kk: values.no_kk || null,
    tempat_lahir: values.tempat_lahir || null,
    tanggal_lahir: values.tanggal_lahir || null,
    jenis_kelamin: values.jenis_kelamin as string | null,
    agama: values.agama || null,
    status_pernikahan: values.status_pernikahan || null,
    alamat: values.alamat || null,
    telepon: values.telepon || null,
    status_kepegawaian_id: values.status_kepegawaian_id ?? null,
    struktur_organisasi_id: values.struktur_organisasi_id ?? null,
    jabatan_fungsional_id: values.jabatan_fungsional_id ?? null,
    jenis_tenaga_id: values.jenis_tenaga_id ?? null,
    eselon: values.eselon || null,
    golongan_id: values.golongan_id ?? null,
    golongan_cpns_id: values.golongan_cpns_id ?? null,
    tmt_pangkat: values.tmt_pangkat || null,
    tmt_jabatan: values.tmt_jabatan || null,
    tmt_cpns: values.tmt_cpns || null,
    tmt_awal: values.tmt_awal || null,
    tmt_akhir: values.tmt_akhir || null,
    tmt_kgb: values.tmt_kgb || null,
    tmt_kgb_seharusnya: values.tmt_kgb_seharusnya || null,
    is_tenaga_medis: values.is_tenaga_medis,
    wajib_str: values.wajib_str,
    wajib_sip: values.wajib_sip,
  };

  const { data, error } = await supabase
    .from("pegawai")
    .update(updateData)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return { error: error.message, data: null };
  }

  // Audit: log perubahan field-level
  if (oldData) {
    const importantFields = [
      "nik", "nip", "nama_lengkap", "status_kepegawaian_id",
      "struktur_organisasi_id", "golongan_id", "tmt_pangkat",
      "tmt_kgb", "tmt_kgb_seharusnya",
    ];

    for (const field of importantFields) {
      const oldVal = String(oldData[field as keyof typeof oldData] ?? "");
      const newVal = String((updateData as Record<string, unknown>)[field] ?? "");
      if (oldVal !== newVal) {
        await logPegawaiChange({
          pegawaiId: id,
          changeType: "UPDATE",
          fieldName: field,
          oldValue: oldVal,
          newValue: newVal,
          changedBy,
          changedByName,
        });
      }
    }
  }

  revalidatePath("/pegawai");

  return { data, error: null };
}

// ============================================================
// SOFT DELETE pegawai
// ============================================================

export async function softDeletePegawai(
  id: string,
  changedBy: string,
  changedByName: string
) {
  const supabase = createServiceClient();

  const { error } = await supabase
    .from("pegawai")
    .update({ is_deleted: true, deleted_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/pegawai");

  return { error: null };
}

// ============================================================
// RESTORE pegawai
// ============================================================

export async function restorePegawai(id: string) {
  const supabase = createServiceClient();

  const { error } = await supabase
    .from("pegawai")
    .update({ is_deleted: false, deleted_at: null })
    .eq("id", id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/pegawai");

  return { error: null };
}

// ============================================================
// DASHBOARD STATS (untuk admin)
// ============================================================

export async function getDashboardStats() {
  const supabase = createServiceClient();

  const [
    { count: totalAktif },
    { count: totalPns },
    { count: totalMedis },
    { data: pensiun12Bulan },
    { data: komposisiGender },
    { data: topUnit },
    { data: aktivitasTerbaru },
  ] = await Promise.all([
    supabase.from("pegawai").select("*", { count: "exact", head: true }).eq("is_deleted", false),
    supabase.from("pegawai").select("*", { count: "exact", head: true }).eq("is_deleted", false).eq("status_kepegawaian_id", 1),
    supabase.from("pegawai").select("*", { count: "exact", head: true }).eq("is_deleted", false).eq("is_tenaga_medis", true),
    supabase.from("pegawai").select("id, nama_lengkap, tanggal_lahir, golongan(nama)").eq("is_deleted", false).not("tanggal_lahir", "is", null).order("tanggal_lahir"),
    supabase.from("pegawai").select("jenis_kelamin").eq("is_deleted", false),
    supabase
      .from("pegawai")
      .select("struktur_organisasi_id, struktur:struktur_organisasi!pegawai_struktur_organisasi_id_fkey(nama)")
      .eq("is_deleted", false),
    supabase.from("pegawai_audit_log").select("*, pegawai:nama_lengkap").order("created_at", { ascending: false }).limit(10),
  ]);

  // Komposisi gender
  const laki = komposisiGender?.filter((p: { jenis_kelamin: string | null }) => p.jenis_kelamin === "Laki-laki").length ?? 0;
  const perempuan = (komposisiGender?.length ?? 0) - laki;

  // Top unit
  const unitCount = new Map<string, number>();
  topUnit?.forEach((p: Record<string, unknown>) => {
    const s = p.struktur as { nama?: string } | null;
    const nama = s?.nama ?? "Belum diisi";
    unitCount.set(nama, (unitCount.get(nama) ?? 0) + 1);
  });
  const sortedUnit = [...unitCount.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([nama, jumlah]) => ({ nama, jumlah }));

  return {
    totalAktif: totalAktif ?? 0,
    totalPns: totalPns ?? 0,
    totalMedis: totalMedis ?? 0,
    rasioGender: { laki, perempuan },
    topUnit: sortedUnit,
    aktivitasTerbaru: aktivitasTerbaru ?? [],
  };
}
