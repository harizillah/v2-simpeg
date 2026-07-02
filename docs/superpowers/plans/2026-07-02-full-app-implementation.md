# SIMPEG RSUD — Full Application Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build complete SIMPEG RSUD application covering all remaining features: full pegawai form, riwayat, sertifikat, KGB/pangkat, dokumen digital, monitoring, laporan, export, pengajuan verifikasi, user management, and pegawai dashboard.

**Architecture:** Bottom-up per module. Each module: services → API routes → hooks → UI pages. Modules build on each other — riwayat depends on pegawai detail, dokumen depends on pegawai detail, monitoring depends on riwayat KGB/pangkat.

**Tech Stack:** Next.js App Router, Supabase, TanStack Query, Sonner toast, Tailwind CSS, shadcn/ui (via `@base-ui/react`), React Hook Form + Zod, date-fns (locale id), Recharts.

## Global Constraints

- Bahasa Indonesia untuk semua label UI, pesan error, toast, empty state, validasi form
- Toast + description wajib pakai Sonner (`toast.success("Judul", { description: "..." })`)
- Tiga state wajib: loading skeleton, empty state, error state
- Service role TIDAK BOLEH masuk client bundle — semua pakai `createServiceClient()` di `"use server"` files
- Button pakai `@base-ui/react/button` — **tidak support `asChild`**, gunakan `router.push()` onClick
- Navigation: `const router = useRouter(); router.push("/path");`
- Audit log: tiap perubahan data pegawai dicatat via `logPegawaiChange()` dari `@/lib/helpers/audit`
- Format tanggal: `formatDate()` dari `@/lib/helpers/format` (dd MMMM yyyy, locale id)
- Zod validator di `@/lib/validators/`
- Services di `@/lib/services/` pakai `"use server"` + `createServiceClient()`
- Hooks di `@/hooks/` pakai TanStack Query
- Halaman di `src/app/(admin)/` atau `src/app/(pegawai)/pegawai/`
- API routes di `src/app/api/`

---

### Task 1: Install Select Component

**Files:**
- Create: `src/components/ui/select.tsx`
- Modify: `package.json` (no changes, `@radix-ui/react-select` already installed)

**Interfaces:**
- Produces: `<Select>`, `<SelectTrigger>`, `<SelectContent>`, `<SelectItem>`, `<SelectValue>` — digunakan di semua form dropdown

- [ ] **Step 1: Run shadcn add select**

```bash
cd "F:\1. Code Aplikasi\v2-simpeg" && npx shadcn@latest add select --yes 2>&1
```

- [ ] **Step 2: Verify file created**

Check `src/components/ui/select.tsx` exists. Open it and verify it imports from `@radix-ui/react-select` and exports Select, SelectTrigger, SelectContent, SelectItem, SelectValue.

- [ ] **Step 3: Commit**

```bash
git add src/components/ui/select.tsx
git commit -m "feat: tambah komponen Select (shadcn/ui)"

Co-Authored-By: Claude <noreply@anthropic.com>
```

---

### Task 2: Full Pegawai Form (Tambahkan Field Kepegawaian)

**Files:**
- Modify: `src/app/(admin)/pegawai/tambah/page.tsx` — expand form with all fields
- Modify: `src/lib/validators/pegawai.ts` — add missing fields
- Modify: `src/app/api/pegawai/route.ts` — handle new fields in POST
- Modify: `src/app/api/pegawai/[id]/route.ts` — handle new fields in PUT
- Create: `src/hooks/use-master-data.ts` — add create/update/delete mutations

**Interfaces:**
- Consumes: `getMasterData` from `@/lib/services/master-data`, `useMasterData` hook, Select component
- Produces: Full pegawai form with dropdown selects for golongan, status, unit, jabatan, jenis tenaga

- [ ] **Step 1: Update pegawai validator to include all fields**

Baca current `src/lib/validators/pegawai.ts`. Ganti dengan schema lengkap yang sudah mencakup semua field. Tambahkan fields: `status_kepegawaian_id`, `struktur_organisasi_id`, `jabatan_fungsional_id`, `jenis_tenaga_id`, `eselon`, `golongan_id`, `golongan_cpns_id`, `tmt_pangkat`, `tmt_jabatan`, `tmt_cpns`, `tmt_awal`, `tmt_akhir`, `tmt_kgb`, `tmt_kgb_seharusnya`, `is_tenaga_medis`, `wajib_str`, `wajib_sip`, `agama`, `status_pernikahan`.

- [ ] **Step 2: Create master data hook with mutations**

Create `src/hooks/use-master-data.ts` if belum ada. Tambahkan `useCreateMasterData`, `useUpdateMasterData`, `useDeleteMasterData` mutations:

```typescript
"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

async function mutateMasterData(
  table: string,
  method: "POST" | "PUT" | "DELETE",
  body?: Record<string, unknown>,
  id?: number
) {
  const url = id ? `/api/master-data/${id}?table=${table}` : `/api/master-data?table=${table}`;
  const res = await fetch(url, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error ?? "Gagal");
  }
  return res.json();
}

export function useCreateMasterData(table: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Record<string, unknown>) => mutateMasterData(table, "POST", body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["master-data", table] });
      toast.success("Berhasil", { description: "Data berhasil ditambahkan" });
    },
    onError: (err: Error) => toast.error("Gagal", { description: err.message }),
  });
}

export function useUpdateMasterData(table: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: Record<string, unknown> }) =>
      mutateMasterData(table, "PUT", body, id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["master-data", table] });
      toast.success("Berhasil", { description: "Data berhasil diperbarui" });
    },
    onError: (err: Error) => toast.error("Gagal", { description: err.message }),
  });
}

export function useDeleteMasterData(table: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => mutateMasterData(table, "DELETE", undefined, id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["master-data", table] });
      toast.success("Berhasil", { description: "Data berhasil dihapus" });
    },
    onError: (err: Error) => toast.error("Gagal", { description: err.message }),
  });
}
```

- [ ] **Step 3: Add master data API route for mutations (POST/PUT/DELETE)**

Create `src/app/api/master-data/route.ts` (modify existing). Tambahkan POST handler:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { createMasterData, type MasterTable } from "@/lib/services/master-data";
import { createClient } from "@/lib/supabase/server";

const VALID_TABLES = [ ... ];

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Silakan login" }, { status: 401 });

  const { searchParams } = request.nextUrl;
  const table = searchParams.get("table") as MasterTable | null;
  if (!table || !VALID_TABLES.includes(table))
    return NextResponse.json({ error: "Parameter table tidak valid" }, { status: 400 });

  const body = await request.json();
  const result = await createMasterData(table, body);
  if (result.error) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json({ success: true, data: result.data });
}
```

Create `src/app/api/master-data/[id]/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { updateMasterData, deleteMasterData, type MasterTable } from "@/lib/services/master-data";
import { createClient } from "@/lib/supabase/server";

const VALID_TABLES = [ ... ];

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Silakan login" }, { status: 401 });

  const { id } = await params;
  const { searchParams } = request.nextUrl;
  const table = searchParams.get("table") as MasterTable | null;
  if (!table || !VALID_TABLES.includes(table))
    return NextResponse.json({ error: "Parameter table tidak valid" }, { status: 400 });

  const body = await request.json();
  const result = await updateMasterData(table, Number(id), body);
  if (result.error) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json({ success: true, data: result.data });
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Silakan login" }, { status: 401 });

  const { id } = await params;
  const { searchParams } = request.nextUrl;
  const table = searchParams.get("table") as MasterTable | null;
  if (!table || !VALID_TABLES.includes(table))
    return NextResponse.json({ error: "Parameter table tidak valid" }, { status: 400 });

  const result = await deleteMasterData(table, Number(id));
  if (result.error) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json({ success: true });
}
```

- [ ] **Step 4: Rewrite tambah pegawai page with full form**

Rewrite `src/app/(admin)/pegawai/tambah/page.tsx`. Import hook `useMasterData` for each dropdown table. Layout form dalam Card-section:
 - **Identitas**: Nama, NIK, NIP, Email, Tempat/Tanggal Lahir, Jenis Kelamin, Agama, Status Pernikahan, Telepon, Alamat
 - **Kepegawaian**: Status Kepegawaian (Select), Unit Kerja (Select), Jabatan Fungsional (Select), Jenis Tenaga (Select), Eselon
 - **Karier**: Golongan (Select), TMT Pangkat (date), TMT Jabatan (date), TMT CPNS (date)
 - **Kontrak**: TMT Awal (date), TMT Akhir (date)
 - **KGB**: TMT KGB (date), TMT KGB Seharusnya (date)
 - **STR/SIP**: Is Tenaga Medis (checkbox), Wajib STR (checkbox), Wajib SIP (checkbox)

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCreatePegawai } from "@/hooks/use-pegawai";
import { useMasterData } from "@/hooks/use-master-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Loader2 } from "lucide-react";

export default function TambahPegawaiPage() {
  const router = useRouter();
  const createPegawai = useCreatePegawai();
  const { data: golongan } = useMasterData("golongan");
  const { data: statusPegawai } = useMasterData("status_pegawai");
  const { data: jabatanFungsional } = useMasterData("jabatan_fungsional");
  const { data: jenisTenaga } = useMasterData("master_jenis_tenaga");
  const { data: strukturOrg } = useMasterData("struktur_organisasi");
  
  const [form, setForm] = useState<Record<string, string | boolean>>({
    nama_lengkap: "", nik: "", nip: "", email: "", tempat_lahir: "",
    tanggal_lahir: "", jenis_kelamin: "", agama: "", status_pernikahan: "",
    telepon: "", alamat: "",
    status_kepegawaian_id: "", struktur_organisasi_id: "",
    jabatan_fungsional_id: "", jenis_tenaga_id: "", eselon: "",
    golongan_id: "", golongan_cpns_id: "",
    tmt_pangkat: "", tmt_jabatan: "", tmt_cpns: "",
    tmt_awal: "", tmt_akhir: "",
    tmt_kgb: "", tmt_kgb_seharusnya: "",
    is_tenaga_medis: false, wajib_str: false, wajib_sip: false,
  });

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(prev => ({ ...prev, [k]: e.target.value }));
  const setBool = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(prev => ({ ...prev, [k]: e.target.checked }));
  const setSelect = (k: string) => (v: string) =>
    setForm(prev => ({ ...prev, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await createPegawai.mutateAsync(form);
    if (result.data?.id) router.push(`/pegawai/${result.data.id}`);
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push("/pegawai")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold">Tambah Pegawai</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Identitas */}
        <Card>
          <CardHeader><CardTitle>Identitas</CardTitle></CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <Field label="Nama Lengkap *"><Input value={form.nama_lengkap as string} onChange={set("nama_lengkap")} required /></Field>
            <Field label="NIK"><Input value={form.nik as string} onChange={set("nik")} maxLength={16} /></Field>
            <Field label="NIP"><Input value={form.nip as string} onChange={set("nip")} maxLength={18} /></Field>
            <Field label="Email"><Input type="email" value={form.email as string} onChange={set("email")} /></Field>
            <Field label="Tempat Lahir"><Input value={form.tempat_lahir as string} onChange={set("tempat_lahir")} /></Field>
            <Field label="Tanggal Lahir"><Input type="date" value={form.tanggal_lahir as string} onChange={set("tanggal_lahir")} /></Field>
            <Field label="Jenis Kelamin">
              <Select value={form.jenis_kelamin as string} onValueChange={setSelect("jenis_kelamin")}>
                <SelectTrigger><SelectValue placeholder="Pilih" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Laki-laki">Laki-laki</SelectItem>
                  <SelectItem value="Perempuan">Perempuan</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="Agama">
              <Select value={form.agama as string} onValueChange={setSelect("agama")}>
                <SelectTrigger><SelectValue placeholder="Pilih" /></SelectTrigger>
                <SelectContent>
                  {["Islam","Kristen","Katolik","Hindu","Buddha","Konghucu"].map(a => (
                    <SelectItem key={a} value={a}>{a}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Status Pernikahan">
              <Select value={form.status_pernikahan as string} onValueChange={setSelect("status_pernikahan")}>
                <SelectTrigger><SelectValue placeholder="Pilih" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Belum Menikah">Belum Menikah</SelectItem>
                  <SelectItem value="Menikah">Menikah</SelectItem>
                  <SelectItem value="Duda">Duda</SelectItem>
                  <SelectItem value="Janda">Janda</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="Telepon"><Input value={form.telepon as string} onChange={set("telepon")} /></Field>
            <Field label="Alamat" className="md:col-span-2"><Input value={form.alamat as string} onChange={set("alamat")} /></Field>
          </CardContent>
        </Card>

        {/* Kepegawaian */}
        <Card>
          <CardHeader><CardTitle>Kepegawaian</CardTitle></CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <Field label="Status Kepegawaian">
              <Select value={form.status_kepegawaian_id as string} onValueChange={setSelect("status_kepegawaian_id")}>
                <SelectTrigger><SelectValue placeholder="Pilih" /></SelectTrigger>
                <SelectContent>
                  {(statusPegawai as { id: number; nama: string }[] | undefined)?.map(s => (
                    <SelectItem key={s.id} value={String(s.id)}>{s.nama}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Unit Kerja">
              <Select value={form.struktur_organisasi_id as string} onValueChange={setSelect("struktur_organisasi_id")}>
                <SelectTrigger><SelectValue placeholder="Pilih" /></SelectTrigger>
                <SelectContent>
                  {(strukturOrg as { id: number; nama: string }[] | undefined)?.map(s => (
                    <SelectItem key={s.id} value={String(s.id)}>{s.nama}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Jabatan Fungsional">
              <Select value={form.jabatan_fungsional_id as string} onValueChange={setSelect("jabatan_fungsional_id")}>
                <SelectTrigger><SelectValue placeholder="Pilih" /></SelectTrigger>
                <SelectContent>
                  {(jabatanFungsional as { id: number; nama: string }[] | undefined)?.map(j => (
                    <SelectItem key={j.id} value={String(j.id)}>{j.nama}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Jenis Tenaga">
              <Select value={form.jenis_tenaga_id as string} onValueChange={setSelect("jenis_tenaga_id")}>
                <SelectTrigger><SelectValue placeholder="Pilih" /></SelectTrigger>
                <SelectContent>
                  {(jenisTenaga as { id: number; nama: string }[] | undefined)?.map(j => (
                    <SelectItem key={j.id} value={String(j.id)}>{j.nama}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Eselon"><Input value={form.eselon as string} onChange={set("eselon")} /></Field>
          </CardContent>
        </Card>

        {/* Karier */}
        <Card>
          <CardHeader><CardTitle>Karier & Golongan</CardTitle></CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <Field label="Golongan">
              <Select value={form.golongan_id as string} onValueChange={setSelect("golongan_id")}>
                <SelectTrigger><SelectValue placeholder="Pilih" /></SelectTrigger>
                <SelectContent>
                  {(golongan as { id: number; nama: string; pangkat?: string | null }[] | undefined)?.map(g => (
                    <SelectItem key={g.id} value={String(g.id)}>{g.nama} - {g.pangkat || ""}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="TMT Pangkat"><Input type="date" value={form.tmt_pangkat as string} onChange={set("tmt_pangkat")} /></Field>
            <Field label="TMT Jabatan"><Input type="date" value={form.tmt_jabatan as string} onChange={set("tmt_jabatan")} /></Field>
            <Field label="TMT CPNS"><Input type="date" value={form.tmt_cpns as string} onChange={set("tmt_cpns")} /></Field>
          </CardContent>
        </Card>

        {/* Kontrak */}
        <Card>
          <CardHeader><CardTitle>Kontrak</CardTitle></CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <Field label="TMT Awal"><Input type="date" value={form.tmt_awal as string} onChange={set("tmt_awal")} /></Field>
            <Field label="TMT Akhir"><Input type="date" value={form.tmt_akhir as string} onChange={set("tmt_akhir")} /></Field>
          </CardContent>
        </Card>

        {/* KGB */}
        <Card>
          <CardHeader><CardTitle>KGB</CardTitle></CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <Field label="TMT KGB"><Input type="date" value={form.tmt_kgb as string} onChange={set("tmt_kgb")} /></Field>
            <Field label="TMT KGB Seharusnya"><Input type="date" value={form.tmt_kgb_seharusnya as string} onChange={set("tmt_kgb_seharusnya")} /></Field>
          </CardContent>
        </Card>

        {/* STR/SIP */}
        <Card>
          <CardHeader><CardTitle>STR / SIP</CardTitle></CardHeader>
          <CardContent className="flex gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.is_tenaga_medis as boolean} onChange={setBool("is_tenaga_medis")} className="h-4 w-4 rounded border-input" />
              <span className="text-sm">Tenaga Medis</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.wajib_str as boolean} onChange={setBool("wajib_str")} className="h-4 w-4 rounded border-input" />
              <span className="text-sm">Wajib STR</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.wajib_sip as boolean} onChange={setBool("wajib_sip")} className="h-4 w-4 rounded border-input" />
              <span className="text-sm">Wajib SIP</span>
            </label>
          </CardContent>
        </Card>

        <div className="flex gap-2">
          <Button type="submit" disabled={createPegawai.isPending}>
            {createPegawai.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Simpan
          </Button>
          <Button variant="outline" type="button" onClick={() => router.push("/pegawai")}>Batal</Button>
        </div>
      </form>
    </div>
  );
}

function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`space-y-2 ${className ?? ""}`}>
      <Label>{label}</Label>
      {children}
    </div>
  );
}
```

- [ ] **Step 5: Verify build**

```bash
cd "F:\1. Code Aplikasi\v2-simpeg" && npx tsc --noEmit 2>&1 | head -20
```
Expected: no errors

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "feat: form pegawai lengkap dengan semua field kepegawaian

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 3: Riwayat Pendidikan CRUD di Tab Detail

**Files:**
- Create: `src/lib/services/riwayat.ts` — service riwayat pendidikan + jabatan
- Create: `src/app/api/pegawai/[id]/riwayat-pendidikan/route.ts`
- Create: `src/app/api/pegawai/[id]/riwayat-pendidikan/[riwayatId]/route.ts`
- Modify: `src/app/(admin)/pegawai/[id]/page.tsx` — ganti placeholder tab Pendidikan + riwayat_jabatan dengan UI nyata

**Interfaces:**
- Consumes: `createServiceClient()`, `useMasterData`, Select component, `logPegawaiChange()`
- Produces: Tab pendidikan dengan list + tambah/edit/delete, tab jabatan RS dengan list + tambah/delete

- [ ] **Step 1: Create riwayat service**

Create `src/lib/services/riwayat.ts`:

```typescript
"use server";

import { createServiceClient } from "@/lib/supabase/service";
import { revalidatePath } from "next/cache";

// ---- Pendidikan ----
export async function createPendidikan(data: {
  pegawaiId: string;
  tingkatPendidikanId?: number;
  namaUniversitas?: string;
  universitasId?: number;
  namaJurusan?: string;
  jurusanId?: number;
  tahunLulus?: number;
  nomorIjazah?: string;
}) {
  const supabase = createServiceClient();
  const { error } = await supabase.from("riwayat_pendidikan").insert({
    pegawai_id: data.pegawaiId,
    tingkat_pendidikan_id: data.tingkatPendidikanId ?? null,
    nama_universitas: data.namaUniversitas ?? null,
    universitas_id: data.universitasId ?? null,
    nama_jurusan: data.namaJurusan ?? null,
    jurusan_id: data.jurusanId ?? null,
    tahun_lulus: data.tahunLulus ?? null,
    nomor_ijazah: data.nomorIjazah ?? null,
  });
  if (error) return { error: error.message };
  revalidatePath(`/pegawai/${data.pegawaiId}`);
  return { error: null };
}

export async function updatePendidikan(id: string, data: { ... }) {
  const supabase = createServiceClient();
  const { error } = await supabase.from("riwayat_pendidikan").update(data).eq("id", id);
  if (error) return { error: error.message };
  return { error: null };
}

export async function deletePendidikan(id: string) {
  const supabase = createServiceClient();
  const { error } = await supabase.from("riwayat_pendidikan").delete().eq("id", id);
  if (error) return { error: error.message };
  return { error: null };
}

// ---- Jabatan RS ----
export async function createJabatanRS(data: {
  pegawaiId: string;
  jabatanRsId: number;
  tmtJabatan?: string;
  keterangan?: string;
}) {
  const supabase = createServiceClient();
  const { error } = await supabase.from("pegawai_jabatan_rs").insert({
    pegawai_id: data.pegawaiId,
    jabatan_rs_id: data.jabatanRsId,
    tmt_jabatan: data.tmtJabatan ?? null,
    keterangan: data.keterangan ?? null,
  });
  if (error) return { error: error.message };
  revalidatePath(`/pegawai/${data.pegawaiId}`);
  return { error: null };
}

export async function deleteJabatanRS(id: number) {
  const supabase = createServiceClient();
  const { error } = await supabase.from("pegawai_jabatan_rs").delete().eq("id", id);
  if (error) return { error: error.message };
  return { error: null };
}
```

- [ ] **Step 2: Create API routes for riwayat pendidikan**

Create `src/app/api/pegawai/[id]/riwayat-pendidikan/route.ts` (POST):

```typescript
import { NextRequest, NextResponse } from "next/server";
import { createPendidikan } from "@/lib/services/riwayat";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Silakan login" }, { status: 401 });

  const { id: pegawaiId } = await params;
  const body = await request.json();
  const result = await createPendidikan({ pegawaiId, ...body });
  if (result.error) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json({ success: true, message: "Riwayat pendidikan ditambahkan" });
}
```

Create `src/app/api/pegawai/[id]/riwayat-pendidikan/[riwayatId]/route.ts` (PUT + DELETE):

```typescript
import { NextRequest, NextResponse } from "next/server";
import { updatePendidikan, deletePendidikan } from "@/lib/services/riwayat";
import { createClient } from "@/lib/supabase/server";

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string; riwayatId: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Silakan login" }, { status: 401 });
  const { riwayatId } = await params;
  const body = await request.json();
  const result = await updatePendidikan(riwayatId, body);
  if (result.error) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json({ success: true, message: "Data diperbarui" });
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string; riwayatId: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Silakan login" }, { status: 401 });
  const { riwayatId } = await params;
  const result = await deletePendidikan(riwayatId);
  if (result.error) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json({ success: true, message: "Data dihapus" });
}
```

Create `src/app/api/pegawai/[id]/jabatan-rs/route.ts` (POST + DELETE with query param):

```typescript
import { NextRequest, NextResponse } from "next/server";
import { createJabatanRS, deleteJabatanRS } from "@/lib/services/riwayat";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Silakan login" }, { status: 401 });
  const { id: pegawaiId } = await params;
  const body = await request.json();
  const result = await createJabatanRS({ pegawaiId, ...body });
  if (result.error) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json({ success: true, message: "Jabatan RS ditambahkan" });
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Silakan login" }, { status: 401 });
  const jabatanId = Number(request.nextUrl.searchParams.get("jabatanId"));
  if (!jabatanId) return NextResponse.json({ error: "jabatanId diperlukan" }, { status: 400 });
  const result = await deleteJabatanRS(jabatanId);
  if (result.error) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json({ success: true, message: "Jabatan RS dihapus" });
}
```

- [ ] **Step 4: Add react-hook-form-based inline form components in detail page tab**

Update `src/app/(admin)/pegawai/[id]/page.tsx` — replace placeholder for tabs `pendidikan`, `jabatan`.

Untuk tab `pendidikan`: tampilkan list riwayat dari `data.riwayat_pendidikan`. Tiap item: tingkat, universitas, jurusan, tahun, ijazah. Tombol "Tambah" buka dialog form.

Untuk tab `jabatan_rs` (di label "Jabatan RS"): tampilkan list dari `data.pegawai_jabatan_rs`, tombol tambah buka dialog.

Pakai Dialog component untuk form tambah pendidikan + hapus.

Komponen `PendidikanTab`:
```tsx
function PendidikanTab({ pegawaiId, data }: { pegawaiId: string; data: any[] }) {
  const [showAdd, setShowAdd] = useState(false);
  // ... dialog tambah pakai Select untuk tingkat pendidikan + Input teks untuk universitas/jurusan/tahun/ijazah
  // ... list item dengan tombol hapus
}
```

Komponen `JabatanTab`:
```tsx
function JabatanRSTab({ pegawaiId, data }: { pegawaiId: string; data: any[] }) {
  const [showAdd, setShowAdd] = useState(false);
  // ... dialog tambah pakai Select untuk jabatan RS + Input date TMT
  // ... list item dengan tombol hapus
}
```

- [ ] **Step 5: Verify build**

```bash
cd "F:\1. Code Aplikasi\v2-simpeg" && npx tsc --noEmit 2>&1 | head -20
```

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "feat: riwayat pendidikan dan jabatan RS CRUD di tab detail pegawai

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 4: Sertifikat/STR/SIP CRUD + Monitoring Kedaluwarsa

**Files:**
- Create: `src/lib/services/sertifikat.ts`
- Create: `src/app/api/pegawai/[id]/sertifikat/route.ts`
- Create: `src/app/api/pegawai/[id]/sertifikat/[sertifikatId]/route.ts`
- Create: `src/app/(admin)/monitoring/str-sip/page.tsx`
- Modify: `src/app/(admin)/pegawai/[id]/page.tsx` — implement tab sertifikat
- Modify: `src/components/admin/sidebar.tsx` — tambah menu monitoring

**Interfaces:**
- Consumes: Select component, Dialog, existing patterns
- Produces: Tab sertifikat CRUD, halaman monitoring STR/SIP kedaluwarsa di dashboard admin

- [ ] **Step 1: Create sertifikat service**

Create `src/lib/services/sertifikat.ts`:

```typescript
"use server";

import { createServiceClient } from "@/lib/supabase/service";

export async function createSertifikat(data: { pegawaiId: string; jenisSertifikat: string; namaKegiatan: string; tmtKegiatan?: string; jumlahJam?: number; penyedia?: string; lokasi?: string; berlakuHingga?: string }) {
  const supabase = createServiceClient();
  const { error } = await supabase.from("pegawai_sertifikat").insert({
    pegawai_id: data.pegawaiId, jenis_sertifikat: data.jenisSertifikat,
    nama_kegiat_an: data.namaKegiatan, tmt_kegiat_an: data.tmtKegiatan ?? null,
    jumlah_jam: data.jumlahJam ?? null, penyedia: data.penyedia ?? null,
    lokasi: data.lokasi ?? null, berlaku_hingga: data.berlakuHingga ?? null,
  });
  if (error) return { error: error.message };
  return { error: null };
}

export async function updateSertifikat(id: string, data: Record<string, unknown>) {
  const supabase = createServiceClient();
  const { error } = await supabase.from("pegawai_sertifikat").update(data).eq("id", id);
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

  const { data: akanKedaluwarsa } = await supabase
    .from("pegawai_sertifikat")
    .select("*, pegawai!inner(nama_lengkap, nip, struktur_organisasi_id, struktur:struktur_organisasi!pegawai_struktur_organisasi_id_fkey(nama))")
    .in("jenis_sertifikat", ["STR", "SIP"])
    .not("berlaku_hingga", "is", null)
    .lte("berlaku_hingga", now)
    .gt("berlaku_hingga", new Date().toISOString().split("T")[0])
    .order("berlaku_hingga");

  const { data: sudahKedaluwarsa } = await supabase
    .from("pegawai_sertifikat")
    .select("*, pegawai!inner(nama_lengkap, nip, struktur_organisasi_id, struktur:struktur_organisasi!pegawai_struktur_organisasi_id_fkey(nama))")
    .in("jenis_sertifikat", ["STR", "SIP"])
    .not("berlaku_hingga", "is", null)
    .lt("berlaku_hingga", new Date().toISOString().split("T")[0])
    .order("berlaku_hingga");

  return { akanKedaluwarsa: akanKedaluwarsa ?? [], sudahKedaluwarsa: sudahKedaluwarsa ?? [], error: null };
}
```

- [ ] **Step 2: Create sertifikat API routes**

Create `src/app/api/pegawai/[id]/sertifikat/route.ts` (GET + POST):

```typescript
import { NextRequest, NextResponse } from "next/server";
import { createSertifikat } from "@/lib/services/sertifikat";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Silakan login" }, { status: 401 });
  const { id: pegawaiId } = await params;
  const body = await request.json();
  const result = await createSertifikat({ pegawaiId, ...body });
  if (result.error) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json({ success: true, message: "Sertifikat ditambahkan" });
}
```

Create `src/app/api/pegawai/[id]/sertifikat/[sertifikatId]/route.ts` (PUT + DELETE):

```typescript
import { NextRequest, NextResponse } from "next/server";
import { updateSertifikat, deleteSertifikat } from "@/lib/services/sertifikat";
import { createClient } from "@/lib/supabase/server";

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string; sertifikatId: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Silakan login" }, { status: 401 });
  const { sertifikatId } = await params;
  const body = await request.json();
  const result = await updateSertifikat(sertifikatId, body);
  if (result.error) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json({ success: true, message: "Sertifikat diperbarui" });
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string; sertifikatId: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Silakan login" }, { status: 401 });
  const { sertifikatId } = await params;
  const result = await deleteSertifikat(sertifikatId);
  if (result.error) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json({ success: true, message: "Sertifikat dihapus" });
}
```

- [ ] **Step 3: Update detail pegawai page — tab sertifikat**

Update `src/app/(admin)/pegawai/[id]/page.tsx`. Ganti placeholder tab `sertifikat` dengan komponen `SertifikatTab`:
- List sertifikat dari `data.pegawai_sertifikat`
- Tiap item: jenis, nama kegiatan, tanggal, penyedia, berlaku hingga
- Badge warna untuk STR/SIP yang akan/mendekati kedaluwarsa
- Tombol tambah + hapus per item

- [ ] **Step 4: Create monitoring STR/SIP page**

Create `src/app/(admin)/monitoring/str-sip/page.tsx`:

```tsx
"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertTriangle, ShieldAlert } from "lucide-react";
import { formatDate } from "@/lib/helpers/format";

async function fetchStrSip() {
  const res = await fetch("/api/monitoring/str-sip");
  if (!res.ok) throw new Error("Gagal");
  return res.json();
}

export default function StrSipPage() {
  const { data, isLoading } = useQuery({ queryKey: ["str-sip"], queryFn: fetchStrSip });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Monitoring STR / SIP</h1>
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-yellow-500" />Akan Kedaluwarsa</CardTitle></CardHeader>
          <CardContent>{/* list akan kedaluwarsa */}</CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><ShieldAlert className="h-4 w-4 text-red-500" />Sudah Kedaluwarsa</CardTitle></CardHeader>
          <CardContent>{/* list sudah kedaluwarsa */}</CardContent>
        </Card>
      </div>
    </div>
  );
}
```

Create `src/app/api/monitoring/str-sip/route.ts`:

```typescript
import { NextResponse } from "next/server";
import { getMonitoringStrSip } from "@/lib/services/sertifikat";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Silakan login" }, { status: 401 });
  const result = await getMonitoringStrSip();
  return NextResponse.json({ data: result });
}
```

- [ ] **Step 5: Update sidebar — tambah menu Monitoring**

Update `src/components/admin/sidebar.tsx`:

```tsx
{
  title: "Monitoring",
  href: "/monitoring",
  icon: <AlertTriangle className="h-5 w-5" />,
  roles: [1, 2],
},
```

Create `src/app/(admin)/monitoring/page.tsx` — redirect ke str-sip atau landing page monitoring.

- [ ] **Step 6: Verify build and commit**

```bash
cd "F:\1. Code Aplikasi\v2-simpeg" && npx tsc --noEmit 2>&1 | head -20
# Expected: no errors

git add -A && git commit -m "feat: sertifikat/STR/SIP CRUD + monitoring kedaluwarsa

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 5: Riwayat KGB CRUD + Monitoring Page

**Files:**
- Modify: `src/lib/services/kgb.ts` — existing, verify
- Create: `src/app/(admin)/monitoring/kgb/page.tsx`
- Create: `src/app/api/riwayat-kenaikan/route.ts`
- Modify: `src/app/(admin)/pegawai/[id]/page.tsx` — implement tab KGB

**Interfaces:**
- Consumes: `getMonitoringKgb`, `tambahRiwayatKgb` from kgb service
- Produces: Monitoring KGB page dengan statistik + filter, tab KGB di detail pegawai

- [ ] **Step 1: Create riwayat kenaikan API route**

Create `src/app/api/riwayat-kenaikan/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { tambahRiwayatKgb } from "@/lib/services/kgb";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Silakan login" }, { status: 401 });
  const body = await request.json();
  const result = await tambahRiwayatKgb(body);
  if (result.error) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json({ success: true, message: "Riwayat KGB ditambahkan" });
}
```

- [ ] **Step 2: Create monitoring KGB page**

Create `src/app/(admin)/monitoring/kgb/page.tsx` — halaman dengan:
- Statistik cards: Total, Normal, Warning, Overdue, No Data
- Filter: status, unit kerja
- Table: nama, NIP, golongan, unit, TMT KGB, KGB berikutnya, status (color badge)
- Pagination

- [ ] **Step 3: Update detail pegawai tab KGB**

Update `src/app/(admin)/pegawai/[id]/page.tsx` tab `kgb`:
- List riwayat KGB dari `data.riwayat_kenaikan` filtered by `jenis_kenaikan === "kgb"`
- Tampilkan: golongan lama, golongan baru, TMT seharusnya, TMT kenaikan, status retroaktif
- Tombol "Tambah Riwayat KGB" buka dialog form

- [ ] **Step 4: Verify build and commit**

```bash
cd "F:\1. Code Aplikasi\v2-simpeg" && npx tsc --noEmit 2>&1 | head -20
git add -A && git commit -m "feat: riwayat KGB CRUD + monitoring KGB page

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 6: Kenaikan Pangkat CRUD + Monitoring

**Files:**
- Create: `src/lib/services/pangkat.ts`
- Create: `src/app/(admin)/monitoring/pangkat/page.tsx`
- Create: `src/app/api/monitoring/pangkat/route.ts`
- Modify: `src/app/(admin)/pegawai/[id]/page.tsx` — tambah tab pangkat

**Interfaces:**
- Consumes: existing golongan master data
- Produces: Monitoring kenaikan pangkat page

- [ ] **Step 1: Create pangkat service**

Create `src/lib/services/pangkat.ts`:

```typescript
"use server";

import { createServiceClient } from "@/lib/supabase/service";

export async function getMonitoringPangkat(filters?: { tahun?: number; unitKerjaId?: number; page?: number; limit?: number }) {
  const supabase = createServiceClient();
  // Hanya PNS & PPPK (status 1,2)
  let query = supabase.from("pegawai")
    .select("id, nama_lengkap, nip, tmt_pangkat, golongan_id, struktur:struktur_organisasi!pegawai_struktur_organisasi_id_fkey(nama), golongan:golongan!pegawai_golongan_id_fkey(nama, pangkat)", { count: "exact" })
    .eq("is_deleted", false)
    .in("status_kepegawaian_id", [1, 2])
    .not("tmt_pangkat", "is", null);

  const { data, error, count } = await query;
  if (error || !data) return { data: null, error: error?.message, count: 0 };

  const result = data.map((p: typeof data[number]) => {
    const tmt = new Date(p.tmt_pangkat!);
    const estimasi = new Date(tmt);
    estimasi.setFullYear(tmt.getFullYear() + 4); // 4 tahun default
    return { ...p, estimasi_pangkat: estimasi.toISOString().split("T")[0], tahun_estimasi: estimasi.getFullYear() };
  });

  // Filter tahun
  let filtered = result;
  if (filters?.tahun) filtered = result.filter((r: { tahun_estimasi: number }) => r.tahun_estimasi === filters.tahun);

  // Sort ascending
  filtered.sort((a: { estimasi_pangkat: string }, b: { estimasi_pangkat: string }) => a.estimasi_pangkat.localeCompare(b.estimasi_pangkat));

  const page = filters?.page ?? 1;
  const limit = filters?.limit ?? 20;
  const paginated = filtered.slice((page - 1) * limit, page * limit);

  return { data: paginated, error: null, count: count ?? 0 };
}
```

- [ ] **Step 2: Create monitoring pangkat page**

Create `src/app/(admin)/monitoring/pangkat/page.tsx`:
- Table: nama, NIP, golongan sekarang, TMT pangkat, estimasi pangkat berikutnya, unit
- Filter: tahun
- Export link (placeholder)

- [ ] **Step 3: Update detail pegawai tab pangkat**

Update detail page tab `kgb` to include sub-tab or section for pangkat. List from `data.riwayat_kenaikan` filtered `jenis_kenaikan === "pangkat"`.

- [ ] **Step 4: Verify build and commit**

```bash
npx tsc --noEmit && git add -A && git commit -m "feat: monitoring kenaikan pangkat + tab di detail pegawai

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 7: Dokumen Digital (Upload/Download/Delete)

**Files:**
- Modify: `src/app/(admin)/pegawai/[id]/page.tsx` — implement tab dokumen (full)
- Modify: `src/lib/services/dokumen.ts` — import `createServiceClient` verify
- Create: `src/app/api/dokumen-pegawai/route.ts` — upload
- Create: `src/app/api/dokumen-pegawai/[id]/route.ts` — download + delete

**Interfaces:**
- Consumes: `usePegawaiDetail` hook (dokumen array), Supabase Storage bucket `dokumen-pegawai`
- Produces: Tab dokumen with upload, download, delete; signed URL download

- [ ] **Step 1: Create upload API route**

Create `src/app/api/dokumen-pegawai/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { validateFile, uploadDokumen } from "@/lib/services/dokumen";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Silakan login" }, { status: 401 });

  const formData = await request.formData();
  const file = formData.get("file") as File;
  const pegawaiId = formData.get("pegawai_id") as string;
  const kategori = formData.get("kategori_dokumen") as string;
  const nama = formData.get("nama_dokumen") as string;

  if (!file || !pegawaiId || !kategori || !nama)
    return NextResponse.json({ error: "Data tidak lengkap" }, { status: 400 });

  const fileError = validateFile({ type: file.type, size: file.size });
  if (fileError) return NextResponse.json({ error: fileError }, { status: 400 });

  const result = await uploadDokumen({
    pegawaiId, file, kategoriDokumen: kategori, namaDokumen: nama,
    nomorDokumen: formData.get("nomor_dokumen") as string | undefined,
    tanggalDokumen: formData.get("tanggal_dokumen") as string | undefined,
    tanggalBerakhir: formData.get("tanggal_berakhir") as string | undefined,
    uploadedBy: user.id,
  });

  if (result.error) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json({ success: true, message: "Dokumen berhasil diunggah", data: result.data });
}
```

- [ ] **Step 2: Create download + delete API route**

Create `src/app/api/dokumen-pegawai/[id]/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { getSignedUrl, nonaktifkanDokumen } from "@/lib/services/dokumen";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Silakan login" }, { status: 401 });

  const { id } = await params;
  const svc = createServiceClient();
  const { data: dok } = await svc.from("dokumen_pegawai").select("file_url").eq("id", id).single();
  if (!dok) return NextResponse.json({ error: "Dokumen tidak ditemukan" }, { status: 404 });

  const { url, error } = await getSignedUrl(dok.file_url);
  if (error) return NextResponse.json({ error }, { status: 500 });
  return NextResponse.redirect(url!);
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Silakan login" }, { status: 401 });

  const { id } = await params;
  const result = await nonaktifkanDokumen(id);
  if (result.error) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json({ success: true, message: "Dokumen dinonaktifkan" });
}
```

- [ ] **Step 3: Implement tab dokumen di detail pegawai**

Update `src/app/(admin)/pegawai/[id]/page.tsx` tab `dokumen`:
- List dokumen dari `data.dokumen_pegawai`
- Tiap item: nama, kategori, tanggal, badge aktif/nonaktif
- Tombol upload (dialog dengan: file input, kategori select, nama, nomor, tanggal)
- Tombol download (redirect ke signed URL)
- Tombol nonaktifkan

- [ ] **Step 4: Verify build and commit**

```bash
npx tsc --noEmit && git add -A && git commit -m "feat: dokumen digital — upload/download/nonaktif via Supabase Storage

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 8: Monitoring Pages (Pensiun + Kontrak)

**Files:**
- Create: `src/app/(admin)/monitoring/pensiun/page.tsx`
- Create: `src/app/(admin)/monitoring/kontrak/page.tsx`
- Create: `src/app/api/monitoring/pensiun/route.ts`
- Create: `src/app/api/monitoring/kontrak/route.ts`

**Interfaces:**
- Consumes: `getLaporanPensiun` from `@/lib/services/pensiun`, existing `getMonitoringKgb`
- Produces: Halaman pensiun dengan filter tahun, halaman kontrak dengan status filter

- [ ] **Step 1: Create pensiun monitoring page**

Create `src/app/(admin)/monitoring/pensiun/page.tsx`:
- Statistik: total pegawai, mendekati pensiun (12 bulan)
- Table: nama, NIP, tanggal lahir, usia, BUP, tanggal pensiun, unit, status
- Filter tahun
- Color badge: mendekati (yellow), normal (blue)

- [ ] **Step 2: Create kontrak monitoring page**

Create `src/app/(admin)/monitoring/kontrak/page.tsx`:
- Statistik: total kontrak, warning (3 bulan), overdue
- Table: nama, status pegawai, TMT awal, TMT akhir, sisa hari, unit
- Filter status
- Color badge: normal (green), warning (yellow), overdue (red), no data (gray)

- [ ] **Step 3: Create API routes**

Create `src/app/api/monitoring/pensiun/route.ts` and `src/app/api/monitoring/kontrak/route.ts` calling existing services with query params.

- [ ] **Step 4: Verify build and commit**

```bash
npx tsc --noEmit && git add -A && git commit -m "feat: halaman monitoring pensiun dan kontrak

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 9: Laporan + Export Excel

**Files:**
- Create: `src/lib/services/laporan.ts`
- Create: `src/app/(admin)/laporan/page.tsx` — list laporan
- Create: `src/app/(admin)/laporan/[jenis]/page.tsx` — detail laporan + export trigger
- Create: `src/app/api/laporan/[jenis]/route.ts`

**Interfaces:**
- Consumes: XLSX library (masih perlu install)
- Produces: Halaman laporan dengan preview + export Excel

**Note:** Untuk export Excel: `npm install xlsx` (XLSX library). Export PDF ditunda ke phase lanjutan (kompleksitas rendering).

- [ ] **Step 1: Install xlsx**

```bash
npm install xlsx
npm install -D @types/xlsx 2>/dev/null || true
```

- [ ] **Step 2: Create laporan service**

Create `src/lib/services/laporan.ts` — fungsi untuk generate data laporan DUK, jenis tenaga, pensiun, KGB, kontrak, bezzeting, komposisi. Export ke Excel menggunakan `xlsx`.

- [ ] **Step 3: Create laporan pages**

Create `src/app/(admin)/laporan/page.tsx`:
- List jenis laporan (card-based): DUK, Jenis Tenaga, Pensiun, KGB, Pangkat, Kontrak, Bezzeting, Komposisi
- Tiap card: judul, deskripsi singkat, icon

Create `src/app/(admin)/laporan/[jenis]/page.tsx`:
- Filter sesuai jenis laporan
- Preview table
- Tombol Export Excel

- [ ] **Step 4: Create laporan API route**

Create `src/app/api/laporan/[jenis]/route.ts` — GET untuk data dan export parameter.

- [ ] **Step 5: Verify build and commit**

```bash
npx tsc --noEmit
# Expected: no errors (may have warnings about xlsx types)
git add -A && git commit -m "feat: laporan + export Excel (DUK, jenis tenaga, pensiun, KGB, kontrak, bezzeting, komposisi)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 10: Template Laporan Custom

**Files:**
- Modify: `src/app/(admin)/laporan/page.tsx` — tambah section template
- Create: `src/app/(admin)/laporan/template/page.tsx`
- Create: `src/app/api/laporan/template/route.ts`

**Interfaces:**
- Consumes: `template_laporan` table
- Produces: CRUD template custom

- [ ] **Step 1: Create template CRUD page**

Create `src/app/(admin)/laporan/template/page.tsx`:
- List template dengan badging (bawaan vs custom)
- Form: pilih jenis laporan, pilih kolom, pilih filter, nama template, save
- Hapus untuk custom template

- [ ] **Step 2: Create template API route**

Create `src/app/api/laporan/template/route.ts` — CRUD template laporan.

- [ ] **Step 3: Verify build and commit**

```bash
npx tsc --noEmit && git add -A && git commit -m "feat: template laporan bawaan dan custom

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 11: Pengajuan Perubahan Data + Verifikasi Admin

**Files:**
- Create: `src/lib/services/pengajuan.ts`
- Create: `src/app/(admin)/verifikasi/page.tsx`
- Create: `src/app/(admin)/verifikasi/[id]/page.tsx`
- Create: `src/app/(pegawai)/pegawai/profil/page.tsx` — ajukan perubahan
- Create: `src/app/api/pengajuan-verifikasi/route.ts`
- Create: `src/app/api/pengajuan-verifikasi/[id]/route.ts`
- Create: `src/app/api/pengajuan-verifikasi/[id]/approve/route.ts`
- Create: `src/app/api/pengajuan-verifikasi/[id]/reject/route.ts`

**Interfaces:**
- Consumes: `pengajuan_verifikasi` table, `pegawai` service
- Produces: Flow pegawai mengajukan → admin verifikasi (approve/reject)

- [ ] **Step 1: Create pengajuan service**

Create `src/lib/services/pengajuan.ts` — fungsi:
- `getPengajuanList(filter)` — list dengan status filter
- `createPengajuan(data)` — pegawai membuat pengajuan
- `approvePengajuan(id, verifikatorId)` — update data pegawai + audit
- `rejectPengajuan(id, verifikatorId, catatan)` — set status ditolak

- [ ] **Step 2: Create verifikasi page (admin)**

Create `src/app/(admin)/verifikasi/page.tsx`:
- Filter: status (pending, diterima, ditolak)
- Table: pegawai, jenis perubahan, status, tanggal
- Detail comparison view (data lama vs data baru)

- [ ] **Step 3: Create verifikasi detail page**

Create `src/app/(admin)/verifikasi/[id]/page.tsx`:
- Side-by-side: data lama | data baru
- Field-level comparison
- Tombol Approve (konfirmasi dialog) + Reject (with catatan textarea)

- [ ] **Step 4: Create pegawai profil page**

Create `src/app/(pegawai)/pegawai/profil/page.tsx`:
- Data pribadi pegawai (read-only view)
- Tombol "Ajukan Perubahan" → pilih field → isi data baru → submit
- List riwayat pengajuan dengan status

- [ ] **Step 5: Create all API routes**

Pengajuan CRUD routes + approve/reject actions.

- [ ] **Step 6: Verify build and commit**

```bash
npx tsc --noEmit && git add -A && git commit -m "feat: pengajuan perubahan data pegawai + verifikasi admin

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 12: User Management (Super Admin)

**Files:**
- Create: `src/app/(admin)/user-management/page.tsx`
- Create: `src/app/api/users/route.ts`
- Create: `src/app/api/users/[id]/route.ts`
- Create: `src/app/api/users/[id]/reset-password/route.ts`

**Interfaces:**
- Consumes: `createServiceClient()` with auth admin API, `profiles` + `roles` tables
- Produces: CRUD user, reset password, role management

- [ ] **Step 1: Create user management service**

Update auth helpers or create new service for user CRUD using `supabase.auth.admin.createUser`, `deleteUser`, `updateUserById`.

- [ ] **Step 2: Create user management page**

Create `src/app/(admin)/user-management/page.tsx`:
- Table: nama, email, role, created_at
- Dialog: tambah user (email, password, nama, role)
- Dialog: reset password
- Dialog: ubah role
- Hanya visible untuk super_admin (role_id = 1)

- [ ] **Step 3: Create API routes**

User CRUD + reset password routes.

- [ ] **Step 4: Verify build and commit**

```bash
npx tsc --noEmit && git add -A && git commit -m "feat: user management untuk super admin

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 13: Dashboard Pegawai

**Files:**
- Modify: `src/app/(pegawai)/pegawai/dashboard/page.tsx` — real data
- Modify: `src/app/(pegawai)/pegawai/layout.tsx` — sidebar pegawai jika belum

**Interfaces:**
- Consumes: pegawai detail for current user
- Produces: Dashboard pegawai with personal data + pengajuan status

- [ ] **Step 1: Create pegawai dashboard with real data**

Update `src/app/(pegawai)/pegawai/dashboard/page.tsx`:
- Card: data identitas (nama, NIP, unit, jabatan)
- Card: status KGB terbaru (jika PNS/PPPK)
- Card: STR/SIP status (jika tenaga medis)
- List: riwayat pengajuan terbaru
- Quick action: Ajukan Perubahan Data

- [ ] **Step 2: Verify build and commit**

```bash
npx tsc --noEmit && git add -A && git commit -m "feat: dashboard pegawai dengan data pribadi nyata

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 14: Final Polish & Bug Fixes

**Files:**
- All pages — review three states (loading, empty, error)
- `src/app/(admin)/layout.tsx` — verify responsive
- `src/app/(pegawai)/pegawai/layout.tsx` — verify

- [ ] **Step 1: Audit semua halaman untuk tiga state**

Review setiap halaman: loading skeleton, empty state dengan icon + teks, error state dengan retry. Pastikan toast punya description.

- [ ] **Step 2: Mobile responsive check**

Semua halaman admin: sidebar collapse di mobile (existing Sheet), table horizontal scroll, form grid 1 column di mobile.

- [ ] **Step 3: Dark mode check**

Verify tidak ada hardcoded color yang pecah di dark mode.

- [ ] **Step 4: Final commit**

```bash
git add -A && git commit -m "fix: polish UI — tiga state, responsive, dark mode

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Dependencies Between Tasks

```
Task 1 (Select) ──> Task 2 (Form) ──> Task 3 (Riwayat) ──> Task 4 (Sertifikat)
                                                         ──> Task 5 (KGB)
                                                         ──> Task 6 (Pangkat)
                                                         ──> Task 7 (Dokumen)
Task 5 ──> Task 8 (Monitoring KGB/Pensiun/Kontrak)
Task 8 ──> Task 9 (Laporan) ──> Task 10 (Template)
Task 3 ──> Task 11 (Pengajuan)
Task 12 (User Management) — independent
Task 11 ──> Task 13 (Dashboard Pegawai)
Task 14 (Polish) — setelah semua
```

## Execution Order

1. Task 1-2 (Select + Full Form)
2. Task 3 (Riwayat Pendidikan + Jabatan)
3. Task 4 (Sertifikat)
4. Task 5 (KGB)
5. Task 6 (Pangkat)
6. Task 7 (Dokumen)
7. Task 8 (Monitoring)
8. Task 9 (Laporan)
9. Task 10 (Template)
10. Task 11 (Pengajuan)
11. Task 12 (User Management)
12. Task 13 (Dashboard Pegawai)
13. Task 14 (Polish)
