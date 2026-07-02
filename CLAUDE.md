# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## SIMPEG RSUD

Sistem Informasi Manajemen Kepegawaian Rumah Sakit — aplikasi web pengelolaan data pegawai, riwayat, KGB, kenaikan pangkat, pensiun, sertifikat, dokumen, laporan, dan audit.

## Commands

```bash
npm run dev          # Dev server (localhost:3000)
npm run build        # Production build
npx tsc --noEmit     # TypeScript check (wajib sebelum commit)
```

Project: `frtwlqgtajcoziapcwmv` (Supabase `satu-data`, ap-southeast-1)

## Tech Stack

| Layer | Teknologi |
|---|---|
| Framework | Next.js App Router |
| Styling | Tailwind CSS + shadcn/ui (`@base-ui/react` buttons, bukan Radix) |
| Icons | Lucide React |
| Charts | Recharts |
| Toast | Sonner |
| Data fetching | TanStack Query (staleTime: 60s, retry: 1) |
| DB | PostgreSQL via Supabase |
| Storage | Supabase Storage private bucket `dokumen-pegawai` |
| Export | xlsx (SheetJS) |

## Role (3)

| Role | role_id | Akses |
|---|---|---|
| `super_admin` | 1 | Akses penuh, user management, audit log delete |
| `admin_kepegawaian` | 2 | CRUD pegawai, laporan, monitoring, verifikasi |
| `pegawai` | 3 | Lihat profil sendiri, ajukan perubahan |

## Pola Kritis — Wajib Diikuti

### Button tidak support `asChild`

Button pakai `@base-ui/react/button`, **bukan** Radix. Tidak ada prop `asChild`. Jangan `<Button asChild><Link ...>`. Gunakan `const router = useRouter(); router.push(...)` di onClick handler.

```tsx
// ❌ Salah
<Button asChild><Link href="/pegawai/tambah">Tambah</Link></Button>

// ✅ Benar
const router = useRouter();
<Button onClick={() => router.push("/pegawai/tambah")}>Tambah</Button>
```

### Service client untuk query profile setelah login

Setelah `signInWithPassword`, session cookie belum tersedia — query `.from("profiles")` dengan server client (anon key) akan kena RLS dan return null. **Selalu pakai `createServiceClient()`** untuk query profile/role di auth flow.

```typescript
// file: src/lib/helpers/auth.ts
// ❌ Salah — server client, RLS memblokir
const supabase = await createClient();
const { data: profile } = await supabase.from("profiles").select(...).single();

// ✅ Benar — service client, bypass RLS
import { createServiceClient } from "@/lib/supabase/service";
const supabase = createServiceClient();
const { data: profile } = await supabase.from("profiles").select(...).single();
```

### createServiceClient itu sync, bukan async

```typescript
// ❌ Salah
const supabase = await createServiceClient();

// ✅ Benar
const supabase = createServiceClient();
```

### `use(params)` — Next.js 16

Semua page dengan dynamic params HARUS pakai `use()`:

```tsx
export default function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  // ...
}
```

### Supabase join return type: single object, bukan array

Supabase `!inner` join (contoh: `struktur_organisasi!pegawai_struktur_organisasi_id_fkey(nama)`) mengembalikan single object, bukan array. Cast sebagai `{ nama?: string }`, bukan `{ nama?: string }[]`.

```typescript
// ❌ Salah — cast as array
(p.struktur as { nama?: string }[])?.nama

// ✅ Benar — cast as object
(p.struktur as { nama?: string })?.nama
```

### Toast + description WAJIB

```tsx
toast.success("Berhasil", { description: "Pegawai berhasil ditambahkan" });
toast.error("Gagal", { description: error.message });
```

## 3 State Wajib Per Halaman

```tsx
if (isLoading) return <Skeleton className="h-96 w-full" />;
if (!data?.length) return <Card><CardContent className="py-12 text-center text-muted-foreground">Belum ada data</CardContent></Card>;
if (error) return <Card><CardContent className="py-12 text-center text-destructive">Gagal memuat data</CardContent></Card>;
```

## Arsitektur

### Folder

```
src/
├── app/                     # Pages & API routes
│   ├── (admin)/             # Admin route group (role 1,2)
│   │   ├── dashboard/       # Statistik, reminder
│   │   ├── pegawai/         # List, tambah, [id] detail, inaktif
│   │   ├── master-data/     # 10 tabel master (tab-based)
│   │   ├── monitoring/      # KGB, pensiun, kontrak, pangkat, STR/SIP
│   │   ├── laporan/         # 8 jenis laporan + template
│   │   ├── verifikasi/      # Pengajuan perubahan data
│   │   └── user-management/ # Super admin only
│   ├── (pegawai)/           # Pegawai route group (role 3)
│   ├── auth/                # Login, callback
│   └── api/                 # REST API routes
├── components/ui/           # shadcn/ui primitives
├── components/admin/        # Sidebar, header
├── hooks/                   # TanStack Query hooks
├── lib/
│   ├── supabase/            # client.ts, server.ts, service.ts
│   ├── services/            # Business logic (server-side)
│   ├── helpers/             # Auth, audit, format utilities
│   └── validators/          # Zod schemas
├── types/database.ts        # Supabase generated types
└── middleware.ts             # Auth guard + role redirect
```

### Server/Client Boundary

```
CLIENT → hooks (TanStack Query) → fetch → API routes → services (server-only) → Supabase Service Role → PostgreSQL
                                                                                                → Storage
```

- **Service role (service.ts):** `"use server"` only, `createServiceClient()` — sync call
- **Server client (server.ts):** Server Components + API routes, `await createClient()` — async, uses cookies
- **Browser client (client.ts):** Client Components, never in API routes

### API Pattern

```
POST   /api/pegawai              → createPegawai() + audit log
GET    /api/pegawai?search=&page= → getPegawaiList()
PUT    /api/pegawai/[id]          → updatePegawai() + audit log
POST   /api/pegawai/[id]/soft-delete → is_deleted = true
POST   /api/pegawai/[id]/restore     → is_deleted = false
```

Semua API routes: auth guard → validasi Zod → panggil service → kirim response `{ success, message, data }` atau `{ error, details }`.

## Database (21 tabel)

### Tabel utama
- `pegawai` — UUID PK, soft delete via `is_deleted` + `deleted_at`, FK ke semua master data
- `struktur_organisasi` — parent-child (adjacency list), gantikan unit_kerja legacy
- `profiles` — 1:1 ke `auth.users`, FK ke `roles`
- `riwayat_kenaikan` — KGB + kenaikan pangkat, field `jenis_kenaikan` = 'kgb' | 'pangkat'
- `dokumen_pegawai` — metadata file, file binary di Supabase Storage
- `pengajuan_verifikasi` — data_lama/data_baru JSONB, status: pending/diterima/ditolak
- `pegawai_audit_log` — field-level audit trail

### Aturan data
- `pegawai.nik` (16 digit) UNIQUE, `pegawai.nip` (18 digit) UNIQUE
- KGB + pangkat: hanya PNS (status_kepegawaian_id=1) dan PPPK (2)
- Kontrak: hanya PPPK (2), Honorer (3), Kontrak (4)
- Kolom legacy: `nama_kegiat_an`, `tmt_kegiat_an` di `pegawai_sertifikat` — jangan rename
- `riwayat_pendidikan` mendukung denormalisasi (teks bebas universitas/jurusan)

### Migrasi
- File: `supabase/migrations/` — apply via MCP `apply_migration` atau Supabase CLI
- Jangan edit migration yang sudah di-apply

## Akun Development

| Role | Email | Password |
|---|---|---|
| Super Admin | `superadmin@simpegrsud.my.id` | `rahasia123` |
| Admin Kepegawaian | `admin@simpegrsud.my.id` | `rahasia123` |
| Pegawai | `pegawai@simpegrsud.my.id` | `rahasia123` |

## Jadikan kebiasaan

1. **Bahasa Indonesia** — semua UI copy, error, toast, empty state
2. **Commit + push** — setiap selesai fitur, commit dengan bahasa Indonesia, push ke GitHub
3. **`npx tsc --noEmit` sebelum commit** — zero errors wajib
4. **Tiga state** — loading skeleton, empty state, error state per halaman
5. **Service role never client** — `createServiceClient()` hanya di `"use server"` files
