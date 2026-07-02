# Database — SIMPEG RSUD

## Overview

PostgreSQL via Supabase. Semua tabel data bisnis harus RLS. Nama tabel/kolom pakai snake_case (legacy dari aplikasi existing). Jangan rename kolom legacy `nama_kegiat_an`/`tmt_kegiat_an` — mapping di aplikasi, bukan di database.

## Tabel Utama (23 tabel)

### Auth & User
| Tabel | Fungsi | RLS |
|---|---|---|
| `roles` | Master role: super_admin, admin_kepegawaian, pegawai | Semua bisa read |
| `profiles` | Profile user (FK ke auth.users + FK ke roles) | User lihat sendiri, admin lihat semua |

### Pegawai & Organisasi
| Tabel | Fungsi | RLS |
|---|---|---|
| `pegawai` | Data utama pegawai. Soft delete via `is_deleted` + `deleted_at` | Admin CRUD, pegawai lihat sendiri |
| `struktur_organisasi` | Hierarki organisasi (parent-child), gantikan unit_kerja datar | Admin CRUD, pegawai read |
| `unit_kerja` | **Legacy.** Dimigrasikan ke `struktur_organisasi` | Read-only, dihapus nanti |
| `golongan` | Master golongan/pangkat (nama, pangkat, kategori, level) | Admin CRUD |
| `status_pegawai` | Master status kepegawaian (PNS, PPPK, honorer, kontrak) | Admin CRUD |
| `jabatan_fungsional` | Master jabatan fungsional | Admin CRUD |
| `jabatan_rs` | Master jabatan struktural RS | Admin CRUD |
| `master_kategori_tenaga` | Kategori tenaga (medis/non-medis) | Admin CRUD |
| `master_jenis_tenaga` | Jenis tenaga, FK ke kategori_tenaga | Admin CRUD |

### Pendidikan
| Tabel | Fungsi | RLS |
|---|---|---|
| `master_tingkat_pendidikan` | SD s/d S3 | Admin CRUD |
| `master_universitas` | Master universitas | Admin CRUD |
| `master_jurusan` | Master jurusan | Admin CRUD |
| `riwayat_pendidikan` | Riwayat pendidikan pegawai. **Denormalisasi:** boleh isi teks bebas universitas/jurusan | Admin CRUD, pegawai lihat sendiri |

### Sertifikat & Dokumen
| Tabel | Fungsi | RLS |
|---|---|---|
| `pegawai_sertifikat` | Sertifikat, STR, SIP. Kolom legacy: `nama_kegiat_an`, `tmt_kegiat_an` | Admin CRUD, pegawai lihat sendiri |
| `riwayat_sertifikat` | **Legacy.** Migrasi ke `pegawai_sertifikat` | Read-only |
| `dokumen_pegawai` | Arsip dokumen digital + lampiran pengajuan. File di Supabase Storage private bucket. | Admin CRUD; pegawai lihat sendiri & upload untuk pengajuan |

### Riwayat & Kenaikan
| Tabel | Fungsi | RLS |
|---|---|---|
| `riwayat_kenaikan` | Riwayat KGB + kenaikan pangkat. Kolom: `jenis_kenaikan`, `golongan_lama_id`, `golongan_baru_id`, `tmt_seharusnya`, `tmt_kenaikan`, `is_retroaktif`, `is_override`, `alasan_override` | Admin CRUD, pegawai lihat sendiri |
| `pegawai_jabatan_rs` | Riwayat jabatan struktural pegawai (mutasi, promosi, demosi) | Admin CRUD, pegawai lihat sendiri |

### Pengajuan & Audit
| Tabel | Fungsi | RLS |
|---|---|---|
| `pengajuan_verifikasi` | Pengajuan perubahan data oleh pegawai. `data_lama`/`data_baru` dalam JSONB. Status: pending/diterima/ditolak | Pegawai CRUD sendiri, admin lihat & approve/reject |
| `pegawai_audit_log` | Audit trail perubahan pegawai. `change_type`, `field_name`, `old_value`, `new_value`, `changed_by` | Admin read, super_admin delete |
| `user_management_log` | Log manajemen user (create/reset password/role change) | Super admin read |
| `template_laporan` | Template laporan bawaan & custom. Konfigurasi dalam JSONB | Admin CRUD, `is_default` hanya super_admin |

## Relasi Kunci

```
roles ──< profiles ──< pegawai
struktur_organisasi ──< pegawai
golongan ──< pegawai (golongan_aktif, golongan_cpns)
jabatan_fungsional ──< pegawai
master_jenis_tenaga ──< pegawai
master_kategori_tenaga ──< master_jenis_tenaga

pegawai ──< riwayat_pendidikan ── master_tingkat_pendidikan
pegawai ──< riwayat_pendidikan ── master_universitas (nullable, bisa teks bebas)
pegawai ──< riwayat_pendidikan ── master_jurusan (nullable, bisa teks bebas)

pegawai ──< pegawai_jabatan_rs ── jabatan_rs
pegawai ──< pegawai_sertifikat
pegawai ──< dokumen_pegawai
pegawai ──< riwayat_kenaikan ── golongan (lama & baru)
pegawai ──< pengajuan_verifikasi ──< dokumen_pegawai
pegawai ──< pegawai_audit_log
profiles ──< user_management_log
profiles ──< template_laporan
```

## RLS Policy Pattern

Setiap tabel data bisnis minimal punya policy:

```sql
-- Contoh: pegawai
CREATE POLICY "admin_dapat_mengelola_semua" ON pegawai
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role_id IN (1, 2)  -- super_admin, admin_kepegawaian
  ));

CREATE POLICY "pegawai_dapat_melihat_data_sendiri" ON pegawai
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
```

## Migrasi

- Gunakan Supabase CLI: `supabase migration new <nama>`
- Migration file: SQL murni, letakkan di `supabase/migrations/`
- Jangan edit migration yang sudah di-apply ke production
- Perubahan schema = migration baru, bukan ALTER langsung di production
- Test migrasi di local Supabase dulu sebelum push

## Aturan Data Penting

1. `pegawai.nik` dan `pegawai.nip` harus unik — cek constraint
2. `struktur_organisasi` adjacency list — jangan buat siklus; validasi di API sebelum insert/update
3. `pegawai.tmt_kgb` dan `pegawai.tmt_kgb_seharusnya` dijaga oleh service KGB, bukan manual
4. Pegawai honorer/kontrak tidak masuk KGB/pangkat — filter `status_kepegawaian` di service
5. `is_deleted = true` → exclude dari semua query dashboard dan laporan (default)
6. `pegawai_sertifikat.berlaku_hingga` — null jika tidak ada masa berlaku
7. `dokumen_pegawai.file_url` — path relatif di Supabase Storage, bukan URL publik
