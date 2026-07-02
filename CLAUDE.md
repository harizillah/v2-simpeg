# CLAUDE.md — SIMPEG RSUD

Sistem Informasi Manajemen Kepegawaian Rumah Sakit.
Aplikasi web pengelolaan data pegawai, riwayat, KGB, kenaikan pangkat, pensiun, sertifikat, dokumen, laporan, dan audit — terpusat, berbasis role, dapat diaudit.

## Tech Stack

| Layer | Teknologi |
|---|---|
| Framework | Next.js App Router |
| Styling | Tailwind CSS + shadcn/ui |
| Icons | Lucide React |
| Charts | Recharts |
| Toast | Sonner |
| Auth | Supabase Auth |
| Database | PostgreSQL via Supabase |
| Storage | Supabase Storage (private bucket) |
| Theme | Light/Dark mode |

## Role (3 role saja)

| Role | Akses |
|---|---|
| `super_admin` | Akses penuh — konfigurasi sistem, user, master data, audit log delete |
| `admin_kepegawaian` | Operasional — CRUD pegawai, laporan, monitoring KGB/pangkat/pensiun, verifikasi pengajuan |
| `pegawai` | Data sendiri — lihat profil pribadi, ajukan perubahan data |

## Aturan Wajib (selalu berlaku)

1. **Bahasa Indonesia** — semua label UI, pesan error, toast, empty state, validasi form
2. **RLS** — semua tabel data bisnis wajib Row Level Security
3. **Soft delete** — `pegawai.is_deleted` + `deleted_at`, tidak hard delete dari UI
4. **Service role** — hanya server-side, TIDAK BOLEH masuk client bundle
5. **Toast + description** — setiap feedback pakai Sonner dan WAJIB ada `description`
6. **Tiga state** — setiap halaman data: loading skeleton, empty state, error state
7. **Middleware auth** — periksa session dan role di middleware, redirect sesuai role
8. **Audit log** — semua perubahan data pegawai tercatat di `pegawai_audit_log`
9. **Private storage** — dokumen via Supabase Storage private bucket + signed URL
10. **Supabase wrapper** — Auth, Storage, signed URL, RLS dibungkus service/helper agar mudah diganti

## File Pengarahan Modular

Untuk detail lebih lanjut, lihat file di `.claude/`:

| File | Isi | Kapan dibaca |
|---|---|---|
| `.claude/architecture.md` | Struktur folder, server/client boundary, alur data | Mulai task besar |
| `.claude/database.md` | Data model, relasi, RLS policy, migrasi | Bikin/tambah tabel, query |
| `.claude/frontend.md` | Konvensi komponen, toast, skeleton, form | Bikin/edit UI |
| `.claude/auth.md` | Flow login, NIK 16-digit, middleware, role guard | Bikin/edit auth |
| `.claude/conventions.md` | Naming, error handling, date format, git | Semua task |

## Dokumentasi Utama

- `PRD.md` — Product Requirements Document lengkap (fitur, modul, requirement, data model, API, UI guideline)
- `docs/superpowers/specs/` — design specs dari sesi brainstorming/planning

## Aturan Umum

- Jangan menambahkan dependency baru tanpa alasan kuat — gunakan yang sudah ada di stack
- Business logic KGB, pensiun, dan kenaikan pangkat dipisahkan ke service khusus
- Form validasi pakai schema (Zod direkomendasikan, konsisten dengan yang sudah dipakai)
- API response format: `{ success, message, data }` atau `{ error, details }` untuk error
- Status code HTTP semantik
- Pencarian pakai debounce, tabel besar pakai pagination
- File upload MVP: hanya PDF, JPG, PNG — maks 5 MB
