# Phase 1: Foundation — SIMPEG RSUD

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Scaffold Next.js project, Supabase clients, database auth schema, NIK/email login flow, middleware role guard, and layout shell with sidebar/header.

**Architecture:** Next.js App Router with two route groups — `(admin)` for super_admin + admin_kepegawaian, `(pegawai)` for pegawai. Supabase Auth handles authentication; custom `profiles` + `roles` tables handle authorization. Middleware checks session and redirects by role. All Supabase calls wrapped in helper/service files under `src/lib/`.

**Tech Stack:** Next.js 15 App Router, TypeScript, Tailwind CSS, shadcn/ui, Supabase Auth + SSR, TanStack Query, Zod, react-hook-form, Sonner, Lucide React, Recharts.

## Global Constraints

- Semua label UI, pesan error, toast, empty state: **Bahasa Indonesia**
- Service role client HANYA di server-side, tidak boleh masuk client bundle
- Setiap toast WAJIB ada `description`
- NIK 16-digit → format email internal: `nik_{16digit}@simpeg.internal`
- RLS harus diaktifkan di semua tabel data bisnis
- Supabase project: `frtwlqgtajcoziapcwmv` (region: ap-southeast-1)
- Nama file: PascalCase untuk komponen, camelCase untuk util/service/hook
- Commit message: Bahasa Indonesia, imperative mood

---

### Task 1: Scaffold Next.js Project

**Files:**
- Create: project root via `npx create-next-app`

**Interfaces:**
- Produces: Running Next.js dev server at `http://localhost:3000`

- [ ] **Step 1: Create Next.js project**

```bash
cd "F:\1. Code Aplikasi\v2-simpeg"
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --turbopack --no-git
```

- [ ] **Step 2: Verify dev server starts**

```bash
npm run dev
```

Expected: Server starts at `http://localhost:3000`, shows default Next.js page.

- [ ] **Step 3: Install core dependencies**

```bash
npm install @supabase/supabase-js @supabase/ssr @tanstack/react-query zod react-hook-form @hookform/resolvers sonner lucide-react recharts
```

- [ ] **Step 4: Init shadcn/ui**

```bash
npx shadcn@latest init -d
```

- [ ] **Step 5: Add shadcn/ui components**

```bash
npx shadcn@latest add button input card dialog table badge skeleton dropdown-menu sheet separator avatar tooltip popover calendar tabs label scroll-area -y
```

- [ ] **Step 6: Add Sonner Toaster**

```bash
npx shadcn@latest add sonner -y
```

- [ ] **Step 7: Verify build succeeds**

```bash
npm run build
```

Expected: Build succeeds without errors.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: scaffold Next.js proyek dengan semua dependency"
```

---

### Task 2: Supabase Client Setup

**Files:**
- Create: `src/lib/supabase/client.ts`
- Create: `src/lib/supabase/server.ts`
- Create: `src/lib/supabase/service.ts`
- Create: `.env.local`

**Interfaces:**
- Produces:
  - `createBrowserClient()` → `SupabaseClient` (browser, anon key)
  - `createServerClient()` → `SupabaseClient` (server, anon key + cookie)
  - `createServiceClient()` → `SupabaseClient` (server-only, service role key)

- [ ] **Step 1: Create `.env.local`**

```
NEXT_PUBLIC_SUPABASE_URL=https://frtwlqgtajcoziapcwmv.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZydHdscWd0YWpjb3ppYXBjd212Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0MzY2OTUsImV4cCI6MjA2NzAxMjY5NX0.1hmBg8E2Mj3xMEYf9f7x4QXQmeDILvqWyg_RbHu_p-Y
SUPABASE_SERVICE_ROLE_KEY=sb_secret_placeholder_ganti_dengan_key_asli
```

> ⚠️ **IMPORTANT:** The anon key above is a placeholder. Get the actual key from Supabase Dashboard → Project Settings → API. User must replace `SUPABASE_SERVICE_ROLE_KEY` with the real service_role key before running.

- [ ] **Step 2: Write `src/lib/supabase/client.ts`**

```ts
import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
```

- [ ] **Step 3: Write `src/lib/supabase/server.ts`**

```ts
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Dipanggil dari Server Component — bisa diabaikan
            // Middleware akan handle set cookie
          }
        },
      },
    }
  );
}
```

- [ ] **Step 4: Write `src/lib/supabase/service.ts`**

```ts
import "server-only";

import { createClient } from "@supabase/supabase-js";

export function createServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}
```

- [ ] **Step 5: Verify — check that `service.ts` has `"server-only"` import**

```bash
grep -n "server-only" src/lib/supabase/service.ts
```

Expected: Line 1 shows `import "server-only";`

- [ ] **Step 6: Commit**

```bash
git add src/lib/supabase/ .env.local
git commit -m "feat: tambah Supabase client (browser, server, service)"
```

---

### Task 3: Database Migration — Roles & Profiles

**Files:**
- Create: `supabase/migrations/20260702000001_auth_schema.sql`

**Interfaces:**
- Produces:
  - Tabel `roles` dengan 3 row seed
  - Tabel `profiles` dengan FK ke `auth.users` dan `roles`
  - RLS policies untuk kedua tabel

- [ ] **Step 1: Write migration SQL**

```sql
-- Migration: auth schema — roles & profiles
-- Tables: roles, profiles
-- RLS: ya

-- 1. Roles master
CREATE TABLE public.roles (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Seed 3 role
INSERT INTO public.roles (id, name) VALUES
  (1, 'super_admin'),
  (2, 'admin_kepegawaian'),
  (3, 'pegawai');

-- Reset sequence setelah manual insert
SELECT setval('roles_id_seq', 3, true);

-- 2. Profiles (1:1 ke auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role_id INTEGER NOT NULL REFERENCES public.roles(id),
  nama_lengkap TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Auto-create profile saat user baru daftar
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, role_id)
  VALUES (NEW.id, 3);  -- default role: pegawai
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 4. RLS: roles — semua authenticated bisa read
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "semua_dapat_membaca_roles" ON public.roles
  FOR SELECT TO authenticated
  USING (true);

-- 5. RLS: profiles — admin bisa lihat semua, user lihat sendiri
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_dapat_mengelola_semua_profile" ON public.profiles
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role_id IN (1, 2)
  ));

CREATE POLICY "user_dapat_melihat_profile_sendiri" ON public.profiles
  FOR SELECT TO authenticated
  USING (id = auth.uid());
```

- [ ] **Step 2: Apply migration ke Supabase**

```bash
# Install Supabase CLI jika belum
npm install supabase --save-dev

# Login & link project
npx supabase login
npx supabase link --project-ref frtwlqgtajcoziapcwmv

# Push migration
npx supabase db push
```

> ⚠️ Jika `supabase db push` gagal karena remote tidak sinkron, gunakan `supabase db push --include-all` atau apply manual via Supabase Dashboard SQL Editor.

- [ ] **Step 3: Verifikasi tabel lewat Supabase MCP**

Gunakan `list_tables` untuk project `frtwlqgtajcoziapcwmv`. Expected: `roles` (3 rows) dan `profiles` (0 rows) muncul.

- [ ] **Step 4: Commit**

```bash
git add supabase/
git commit -m "feat: tambah migrasi roles dan profiles dengan RLS"
```

---

### Task 4: Auth Helpers

**Files:**
- Create: `src/lib/helpers/auth.ts`

**Interfaces:**
- Consumes: `createServerClient()` dari `@/lib/supabase/server`, `createServiceClient()` dari `@/lib/supabase/service`
- Produces:
  - `loginWithEmailOrNIK(identifier: string, password: string): Promise<{ success: boolean; error?: string; role?: string }>`
  - `logout(): Promise<void>`
  - `getUserRole(userId: string): Promise<string | null>`

- [ ] **Step 1: Write `src/lib/helpers/auth.ts`**

```ts
"use server";

import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { redirect } from "next/navigation";

const NIK_REGEX = /^\d{16}$/;
const INTERNAL_DOMAIN = "@simpeg.internal";

function formatEmail(identifier: string): string {
  if (NIK_REGEX.test(identifier)) {
    return `nik_${identifier}${INTERNAL_DOMAIN}`;
  }
  return identifier;
}

export async function loginWithEmailOrNIK(
  identifier: string,
  password: string
): Promise<{ success: boolean; error?: string; role?: string }> {
  const email = formatEmail(identifier.trim());
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return {
      success: false,
      error: "Email/NIK atau password salah",
    };
  }

  if (!data.user) {
    return {
      success: false,
      error: "Gagal masuk. Silakan coba lagi.",
    };
  }

  // Cek role
  const { data: profile } = await supabase
    .from("profiles")
    .select("role_id, roles(name)")
    .eq("id", data.user.id)
    .single();

  if (!profile) {
    // Force logout — user tidak punya profile
    await supabase.auth.signOut();
    return {
      success: false,
      error: "Akun tidak memiliki akses. Hubungi administrator.",
    };
  }

  // Ambil nama role dari join (jika tersedia), fallback ke query langsung
  let roleName: string | null = null;
  if (profile.roles && typeof profile.roles === "object" && "name" in profile.roles) {
    roleName = (profile.roles as { name: string }).name;
  } else {
    const { data: roleData } = await supabase
      .from("roles")
      .select("name")
      .eq("id", profile.role_id)
      .single();
    roleName = roleData?.name ?? null;
  }

  return { success: true, role: roleName ?? undefined };
}

export async function logout(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/auth/login");
}

export async function getUserRole(
  userId: string
): Promise<string | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("roles(name)")
    .eq("id", userId)
    .single();

  if (data?.roles && typeof data.roles === "object" && "name" in data.roles) {
    return (data.roles as { name: string }).name;
  }
  return null;
}
```

- [ ] **Step 2: Verifikasi tipe — build check**

```bash
npx tsc --noEmit
```

Expected: Tidak ada error tipe.

- [ ] **Step 3: Commit**

```bash
git add src/lib/helpers/auth.ts
git commit -m "feat: tambah auth helpers (login NIK, logout, role check)"
```

---

### Task 5: Login Page

**Files:**
- Create: `src/app/auth/login/page.tsx`
- Create: `src/app/auth/callback/route.ts`
- Create: `src/app/auth/login/login-form.tsx`

**Interfaces:**
- Consumes: `loginWithEmailOrNIK()` dari `@/lib/helpers/auth`
- Produces: Halaman login di `/auth/login`, callback handler di `/auth/callback`

- [ ] **Step 1: Write login form — `src/app/auth/login/login-form.tsx`**

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { loginWithEmailOrNIK } from "@/lib/helpers/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { LogIn, Eye, EyeOff } from "lucide-react";

export function LoginForm() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!identifier.trim() || !password) {
      toast.error("Form belum lengkap", {
        description: "Silakan isi NIK/email dan password.",
      });
      return;
    }

    setIsLoading(true);
    try {
      const result = await loginWithEmailOrNIK(identifier, password);

      if (!result.success) {
        toast.error("Gagal masuk", {
          description: result.error || "Terjadi kesalahan.",
        });
        return;
      }

      toast.success("Berhasil masuk", {
        description: "Selamat datang di SIMPEG RSUD.",
      });

      router.refresh();

      if (result.role === "pegawai") {
        router.push("/pegawai/dashboard");
      } else {
        router.push("/dashboard");
      }
    } catch {
      toast.error("Gagal masuk", {
        description: "Terjadi kesalahan. Silakan coba lagi.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-1 text-center">
        <CardTitle className="text-2xl font-bold">SIMPEG RSUD</CardTitle>
        <CardDescription>
          Masuk menggunakan NIK (16 digit) atau email
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="identifier">NIK atau Email</Label>
            <Input
              id="identifier"
              type="text"
              placeholder="Masukkan NIK 16 digit atau email"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              disabled={isLoading}
              autoComplete="username"
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Masukkan password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                autoComplete="current-password"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full px-3"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              "Memproses..."
            ) : (
              <>
                <LogIn className="mr-2 h-4 w-4" />
                Masuk
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 2: Write login page — `src/app/auth/login/page.tsx`**

```tsx
import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4">
      <LoginForm />
    </div>
  );
}
```

- [ ] **Step 3: Write auth callback — `src/app/auth/callback/route.ts`**

```ts
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Error — redirect ke login
  return NextResponse.redirect(`${origin}/auth/login`);
}
```

- [ ] **Step 4: Verify build**

```bash
npm run build
```

Expected: Build sukses. Halaman `/auth/login` dan `/auth/callback` terdaftar.

- [ ] **Step 5: Commit**

```bash
git add src/app/auth/
git commit -m "feat: tambah halaman login dan auth callback"
```

---

### Task 6: Middleware — Auth Guard

**Files:**
- Create: `src/middleware.ts`

**Interfaces:**
- Consumes: Supabase server client
- Produces: Request redirect untuk user yang belum login atau salah role

- [ ] **Step 1: Write `src/middleware.ts`**

```ts
import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

// Rute yang tidak perlu auth
const PUBLIC_ROUTES = [
  "/auth/login",
  "/auth/callback",
  "/auth/error",
];

// Rute khusus pegawai
const PEGAWAI_ROUTES = ["/pegawai"];

// Rute khusus admin
const ADMIN_ROUTES = ["/dashboard", "/pegawai", "/master-data", "/laporan", "/verifikasi", "/user-management"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Izinkan rute publik
  if (PUBLIC_ROUTES.some((route) => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Izinkan asset statis dan API internal Next.js
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/favicon.ico")
  ) {
    return NextResponse.next();
  }

  // Buat Supabase client untuk middleware
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { session } } = await supabase.auth.getSession();

  // Belum login → redirect ke login
  if (!session) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/login";
    return NextResponse.redirect(url);
  }

  // Ambil role user
  const { data: profile } = await supabase
    .from("profiles")
    .select("role_id")
    .eq("id", session.user.id)
    .single();

  const roleId = profile?.role_id ?? 0;

  // Redirect root ke dashboard sesuai role
  if (pathname === "/") {
    const url = request.nextUrl.clone();
    url.pathname = roleId === 3 ? "/pegawai/dashboard" : "/dashboard";
    return NextResponse.redirect(url);
  }

  // Pegawai (role_id 3) tidak boleh akses rute admin
  if (roleId === 3 && ADMIN_ROUTES.some((route) => pathname.startsWith(route))) {
    const url = request.nextUrl.clone();
    url.pathname = "/pegawai/dashboard";
    return NextResponse.redirect(url);
  }

  // Admin (role_id 1,2) tidak boleh akses rute pegawai
  if (roleId !== 3 && PEGAWAI_ROUTES.some((route) => pathname.startsWith(route))) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
```

- [ ] **Step 2: Verify middleware TypeScript**

```bash
npx tsc --noEmit
```

Expected: Tidak ada error.

- [ ] **Step 3: Commit**

```bash
git add src/middleware.ts
git commit -m "feat: tambah middleware auth guard dengan role redirect"
```

---

### Task 7: Layout Shell — Root Layout & Providers

**Files:**
- Modify: `src/app/layout.tsx`
- Create: `src/components/providers.tsx`

**Interfaces:**
- Consumes: Theme provider, TanStack Query provider, Sonner Toaster
- Produces: Root layout dengan semua provider dan Toaster

- [ ] **Step 1: Write providers — `src/components/providers.tsx`**

```tsx
"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { Toaster } from "@/components/ui/sonner";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            retry: 1,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <Toaster
        position="top-right"
        richColors
        closeButton
        duration={4000}
      />
    </QueryClientProvider>
  );
}
```

- [ ] **Step 2: Update `src/app/layout.tsx`**

```tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "SIMPEG RSUD",
  description: "Sistem Informasi Manajemen Kepegawaian Rumah Sakit",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
```

- [ ] **Step 3: Verify build**

```bash
npm run build
```

Expected: Build sukses.

- [ ] **Step 4: Commit**

```bash
git add src/app/layout.tsx src/components/providers.tsx
git commit -m "feat: tambah root layout dengan providers (QueryClient, Sonner)"
```

---

### Task 8: Layout Shell — Sidebar & Header untuk Admin

**Files:**
- Create: `src/app/(admin)/layout.tsx`
- Create: `src/components/admin/sidebar.tsx`
- Create: `src/components/admin/header.tsx`
- Create: `src/app/(admin)/dashboard/page.tsx`

**Interfaces:**
- Produces: Layout admin dengan sidebar tetap + header, dashboard placeholder

- [ ] **Step 1: Write sidebar — `src/components/admin/sidebar.tsx`**

```tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  LayoutDashboard,
  Users,
  Database,
  FileText,
  ClipboardCheck,
  Shield,
  Menu,
  LogOut,
} from "lucide-react";
import { logout } from "@/lib/helpers/auth";
import { useState } from "react";

interface NavItem {
  title: string;
  href: string;
  icon: React.ReactNode;
  roles: number[]; // role_id yang bisa akses
}

const navItems: NavItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: <LayoutDashboard className="h-5 w-5" />,
    roles: [1, 2],
  },
  {
    title: "Data Pegawai",
    href: "/pegawai",
    icon: <Users className="h-5 w-5" />,
    roles: [1, 2],
  },
  {
    title: "Master Data",
    href: "/master-data",
    icon: <Database className="h-5 w-5" />,
    roles: [1, 2],
  },
  {
    title: "Laporan",
    href: "/laporan",
    icon: <FileText className="h-5 w-5" />,
    roles: [1, 2],
  },
  {
    title: "Verifikasi",
    href: "/verifikasi",
    icon: <ClipboardCheck className="h-5 w-5" />,
    roles: [1, 2],
  },
  {
    title: "Manajemen User",
    href: "/user-management",
    icon: <Shield className="h-5 w-5" />,
    roles: [1], // super_admin only
  },
];

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="flex h-14 items-center border-b px-4">
        <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
          <Shield className="h-6 w-6 text-primary" />
          <span>SIMPEG RSUD</span>
        </Link>
      </div>

      {/* Navigasi */}
      <ScrollArea className="flex-1 px-2 py-4">
        <nav className="space-y-1">
          {navItems.map((item) => (
            <Button
              key={item.href}
              variant={pathname === item.href ? "secondary" : "ghost"}
              className={cn("w-full justify-start gap-3")}
              asChild
              onClick={onNavigate}
            >
              <Link href={item.href}>
                {item.icon}
                <span>{item.title}</span>
              </Link>
            </Button>
          ))}
        </nav>
      </ScrollArea>

      {/* Logout */}
      <div className="border-t p-2">
        <form action={logout}>
          <Button variant="ghost" className="w-full justify-start gap-3 text-muted-foreground">
            <LogOut className="h-5 w-5" />
            <span>Keluar</span>
          </Button>
        </form>
      </div>
    </div>
  );
}

export function Sidebar() {
  return (
    <>
      {/* Desktop sidebar */}
      <aside className="fixed left-0 top-0 z-40 hidden h-screen w-64 border-r bg-background lg:block">
        <SidebarContent />
      </aside>

      {/* Mobile sidebar */}
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="lg:hidden">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Buka menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0">
          <SidebarContent />
        </SheetContent>
      </Sheet>
    </>
  );
}
```

- [ ] **Step 2: Write header — `src/components/admin/header.tsx`**

```tsx
"use client";

import { Sidebar } from "./sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { LogOut, User } from "lucide-react";
import { logout } from "@/lib/helpers/auth";

export function Header() {
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 lg:px-6">
      <Sidebar />

      <div className="flex-1" />

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="rounded-full">
            <Avatar className="h-8 w-8">
              <AvatarFallback>
                <User className="h-4 w-4" />
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>Akun Saya</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <form action={logout} className="w-full">
              <button type="submit" className="flex w-full items-center gap-2">
                <LogOut className="h-4 w-4" />
                <span>Keluar</span>
              </button>
            </form>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
```

- [ ] **Step 3: Write admin layout — `src/app/(admin)/layout.tsx`**

```tsx
import { Header } from "@/components/admin/header";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      <Header />
      <main className="lg:pl-64">
        <div className="container mx-auto p-4 lg:p-6">{children}</div>
      </main>
    </div>
  );
}
```

- [ ] **Step 4: Write admin dashboard placeholder — `src/app/(admin)/dashboard/page.tsx`**

```tsx
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function AdminDashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Selamat datang di Sistem Informasi Manajemen Kepegawaian RSUD.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Pegawai
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">—</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              KGB Bulan Ini
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">—</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Kenaikan Pangkat
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">—</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pensiun 6 Bulan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">—</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Verify build**

```bash
npm run build
```

Expected: Build sukses. Semua rute di dalam `(admin)` muncul.

- [ ] **Step 6: Commit**

```bash
git add src/app/\(admin\)/ src/components/admin/
git commit -m "feat: tambah layout admin dengan sidebar dan header"
```

---

### Task 9: Layout Shell — Pegawai

**Files:**
- Create: `src/app/(pegawai)/layout.tsx`
- Create: `src/app/(pegawai)/dashboard/page.tsx`

**Interfaces:**
- Produces: Layout pegawai sederhana dengan header, dashboard placeholder

- [ ] **Step 1: Write pegawai layout — `src/app/(pegawai)/layout.tsx`**

```tsx
import { Header } from "@/components/admin/header";

export default function PegawaiLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      <Header />
      <main>
        <div className="container mx-auto p-4 lg:p-6">{children}</div>
      </main>
    </div>
  );
}
```

- [ ] **Step 2: Write pegawai dashboard — `src/app/(pegawai)/dashboard/page.tsx`**

```tsx
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function PegawaiDashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Selamat datang di SIMPEG RSUD. Lihat profil dan ajukan perubahan data Anda.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Profil Saya
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Segera hadir</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Riwayat KGB
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Segera hadir</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Dokumen Saya
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Segera hadir</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Write root redirect — `src/app/page.tsx`**

```tsx
import { redirect } from "next/navigation";

export default function RootPage() {
  redirect("/dashboard");
}
```

- [ ] **Step 4: Verify build**

```bash
npm run build
```

Expected: Build sukses, semua rute OK.

- [ ] **Step 5: Commit**

```bash
git add src/app/\(pegawai\)/ src/app/page.tsx
git commit -m "feat: tambah layout pegawai dan dashboard placeholder"
```

---

### Task 10: Final Verification & Git Push

- [ ] **Step 1: Full build check**

```bash
npm run build
```

Expected: Build sukses, tidak ada error atau warning.

- [ ] **Step 2: TypeScript check penuh**

```bash
npx tsc --noEmit
```

Expected: Tidak ada error tipe.

- [ ] **Step 3: Review struktur folder**

Verifikasi bahwa struktur mengikuti architecture doc:

```
src/
├── app/
│   ├── (admin)/dashboard/page.tsx   ✓
│   ├── (admin)/layout.tsx           ✓
│   ├── (pegawai)/dashboard/page.tsx  ✓
│   ├── (pegawai)/layout.tsx         ✓
│   ├── auth/login/                  ✓
│   ├── auth/callback/               ✓
│   ├── layout.tsx                   ✓
│   ├── page.tsx                     ✓
│   └── globals.css
├── components/
│   ├── ui/                          ✓ (shadcn)
│   ├── admin/                       ✓
│   └── providers.tsx                ✓
├── lib/
│   ├── supabase/                    ✓
│   ├── helpers/auth.ts              ✓
│   └── utils.ts
└── middleware.ts                    ✓
```

- [ ] **Step 4: Push ke GitHub**

```bash
git push origin master
```

- [ ] **Step 5: Commit final**

```bash
git add -A
git commit -m "chore: finalisasi Phase 1 foundation"
git push origin master
```

---
