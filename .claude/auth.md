# Auth — SIMPEG RSUD

## Overview

Supabase Auth + custom profile/role di tabel `profiles` + `roles`. 3 role: `super_admin`, `admin_kepegawaian`, `pegawai`.

## Login Flow

```
User input email/NIK + password
        │
        ▼
┌─────────────────────────┐
│ Apakah input 16 digit?  │
└────┬────────────────────┘
     │
     ├── Ya: NIK → ubah ke format email internal
     │         nik = "1234567890123456"
     │         → identifier = "nik_1234567890123456@simpeg.internal"
     │
     └── Tidak: pakai langsung sebagai email
              identifier = input_user
        │
        ▼
┌─────────────────────────┐
│ Supabase Auth           │
│ signInWithPassword()    │
└────┬────────────────────┘
     │
     ├── Gagal → error "Email/NIK atau password salah"
     │
     └── Sukses
        │
        ▼
┌─────────────────────────┐
│ Cek profiles + role     │
│ FROM profiles           │
│ JOIN roles ON ...       │
│ WHERE id = auth.uid()   │
└────┬────────────────────┘
     │
     ├── Tidak ada profile/role → force logout, error "Akun tidak memiliki akses"
     │
     └── Ada
        │
        ▼
┌─────────────────────────┐
│ Redirect berdasarkan    │
│ role:                   │
│ super_admin    → /dashboard  │
│ admin_kepegawaian → /dashboard │
│ pegawai        → /pegawai/dashboard │
└─────────────────────────┘
```

## Middleware (`middleware.ts`)

```ts
// Pseudocode — jangan copy mentah, ini pola
export async function middleware(req: NextRequest) {
  const supabase = createServerClient(/* ... */);
  const { data: { session } } = await supabase.auth.getSession();

  // Belum login → redirect /auth/login
  if (!session) {
    return redirectTo("/auth/login");
  }

  // Ambil role dari profiles
  const role = await getUserRole(session.user.id);

  // Route group check
  if (req.nextUrl.pathname.startsWith("/(admin)") && role === "pegawai") {
    return redirectTo("/pegawai/dashboard");
  }
  if (req.nextUrl.pathname.startsWith("/(pegawai)") && role !== "pegawai") {
    return redirectTo("/dashboard");
  }
}
```

## Supabase Client Types

| Client | File | Key | Penggunaan |
|---|---|---|---|
| Browser | `lib/supabase/client.ts` | Anon key | Komponen "use client", hooks |
| Server | `lib/supabase/server.ts` | Anon key + cookie | Server components, middleware |
| Service Role | `lib/supabase/service.ts` | Service role key | API routes ONLY |

**Service role client TIDAK BOLEH diimpor dari komponen client.**
Kalau muncul di client bundle, itu bug security.

## Auth Helpers (`lib/helpers/auth.ts`)

Fungsi helper yang membungkus Supabase Auth agar mudah diganti:

```ts
// Semua operasi auth via helper ini, jangan panggil supabase.auth langsung
loginWithEmailOrNIK(identifier: string, password: string): Promise<AuthResult>
logout(): Promise<void>
createUserAccount(email: string, password: string, roleId: number): Promise<User>
resetUserPassword(userId: string): Promise<void>
getUserRole(userId: string): Promise<string>
```

## Operasi Admin (Server-Only)

Semua operasi admin harus lewat API route, bukan dari client:

| Operasi | Endpoint | Role |
|---|---|---|
| Buat user + pegawai | POST `/api/pegawai/create` | Admin |
| Reset password | POST `/api/pegawai/reset-password` | Admin |
| List user | GET `/api/users` | Super Admin |
| Buat user admin | POST `/api/users` | Super Admin |
| Update role user | PUT `/api/users/[id]` | Super Admin |
| Delete audit log | DELETE `/api/audit-log/delete` | Super Admin |

## Password Rules

- Minimal 8 karakter
- Reset hanya oleh admin/super_admin via API route
- Tidak ada self-service reset password untuk MVP

## Akun Pegawai

- Dibuat bersamaan dengan data pegawai oleh admin
- Format email internal untuk NIK: `nik_<16-digit>@simpeg.internal`
- Pegawai bisa login dengan NIK atau email asli (jika ada)
- Email eksternal (jika diisi) harus unik
