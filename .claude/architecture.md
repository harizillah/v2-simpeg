# Architecture — SIMPEG RSUD

## Struktur Folder

```
src/
├── app/                    # Next.js App Router pages & API
│   ├── layout.tsx          # Root layout: providers, sidebar, header
│   ├── page.tsx            # Redirect ke dashboard sesuai role
│   ├── (admin)/            # Route group admin (super_admin + admin_kepegawaian)
│   │   ├── dashboard/
│   │   ├── pegawai/
│   │   ├── master-data/
│   │   ├── laporan/
│   │   ├── verifikasi/
│   │   └── user-management/   # super_admin only
│   ├── (pegawai)/           # Route group pegawai
│   │   ├── dashboard/
│   │   └── profil/
│   ├── auth/
│   │   ├── login/
│   │   └── callback/
│   └── api/                # API route handlers
│       ├── pegawai/
│       ├── users/
│       ├── riwayat-kenaikan/
│       ├── sertifikat/
│       ├── dokumen-pegawai/
│       ├── pengajuan-verifikasi/
│       ├── struktur-organisasi/
│       ├── laporan/
│       ├── cek-status-kgb/
│       ├── masa-akhir-kontrak/
│       └── audit-log/
├── components/
│   ├── ui/                 # shadcn/ui primitives (button, input, table, etc.)
│   ├── shared/             # Komponen reusable lintas modul
│   │   ├── data-table/     # Tabel generik: sort, filter, pagination
│   │   ├── export-button/  # Export Excel/PDF
│   │   └── reminder-card/  # Card reminder KGB/pangkat/pensiun
│   ├── admin/              # Komponen spesifik admin
│   └── pegawai/            # Komponen spesifik pegawai
├── lib/
│   ├── supabase/           # Supabase client (browser, server, service-role)
│   │   ├── client.ts       # Browser client (anon key)
│   │   ├── server.ts       # Server client (anon key + cookie)
│   │   └── service.ts      # Service role client (SERVER ONLY)
│   ├── services/           # Business logic
│   │   ├── kgb.ts          # Kalkulasi & sinkronisasi KGB
│   │   ├── pensiun.ts      # Kalkulasi BUP & pensiun
│   │   ├── pangkat.ts      # Kalkulasi kenaikan pangkat
│   │   ├── laporan.ts      # Laporan & export
│   │   └── dokumen.ts      # Upload/download dokumen
│   ├── helpers/            # Utility functions
│   │   ├── auth.ts         # Auth wrapper (login NIK, reset password, role check)
│   │   ├── audit.ts        # Audit log helper
│   │   └── format.ts       # Date, currency, text formatting
│   └── validators/         # Zod schemas
│       ├── pegawai.ts
│       ├── auth.ts
│       └── common.ts
├── hooks/                  # Custom React hooks
│   ├── use-pegawai.ts
│   ├── use-auth.ts
│   └── use-reminder.ts
├── types/                  # TypeScript type definitions
│   ├── database.ts         # Generated Supabase types
│   └── app.ts              # App-specific types
└── middleware.ts            # Auth guard: session check + role redirect
```

## Server vs Client Boundary

```
┌──────────────────────────────────────────────────┐
│ CLIENT (Browser)                                 │
│ ┌──────────────┐  ┌──────────────┐               │
│ │ "use client" │  │ Components   │               │
│ │ Supabase     │  │ Hooks        │               │
│ │ Browser      │  │ shadcn/ui    │               │
│ └──────┬───────┘  └──────────────┘               │
│        │                                          │
│ ─ ─ ─ ─│─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─│
│        │ Boundary — JANGAN lintasi                │
│ ─ ─ ─ ─│─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─│
│        ▼                                          │
│ SERVER (Node.js)                                 │
│ ┌──────────────┐  ┌──────────────┐               │
│ │ API Routes   │  │ Server       │               │
│ │ Route Handlers│  │ Components   │               │
│ └──────┬───────┘  └──────────────┘               │
│        │                                          │
│ ┌──────▼───────┐                                  │
│ │ Supabase     │  Service Role — hanya di sini    │
│ │ Service Role │                                  │
│ └──────┬───────┘                                  │
│        │                                          │
│ ─ ─ ─ ─│─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─│
│        ▼                                          │
│ PostgreSQL + Storage (Supabase)                   │
└──────────────────────────────────────────────────┘
```

## Alur Data

### Read (pegawai list)
1. Client: `use-pegawai.ts` hook → fetch ke `/api/pegawai` atau langsung Supabase Browser client
2. RLS memfilter data sesuai role user
3. Data dikembalikan, TanStack Query cache & revalidate

### Write (edit pegawai)
1. Client: form submit → POST/PUT `/api/pegawai/[id]`
2. API route: validasi Zod schema → Supabase Service Role → tulis ke database
3. API route: catat audit log via `helpers/audit.ts`
4. Response: `{ success, message }` → client toast → TanStack Query invalidate

### Upload dokumen
1. Client: file input → POST `/api/dokumen-pegawai` (FormData)
2. API route: validasi tipe & ukuran (PDF/JPG/PNG, max 5MB) → Supabase Storage upload
3. Simpan metadata ke `dokumen_pegawai`
4. Kembalikan signed URL saat perlu download (private bucket)

## Prinsip Arsitektur

- **Service role NEVER client** — semua operasi admin/privileged lewat API route
- **Business logic terpusat** — KGB, pensiun, pangkat masing-masing satu service file
- **Supabase dibungkus** — `lib/supabase/` dan `lib/helpers/auth.ts` jadi adapter; ganti hosting = ganti di sini saja
- **TanStack Query** — semua data fetching client pakai query hooks, bukan useEffect + fetch manual
- **API route tipis** — validasi input, panggil service/helper, kirim response. Tidak ada business logic di route handler.
