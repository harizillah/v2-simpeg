# Conventions — SIMPEG RSUD

## Bahasa

- **Semua teks user-facing: Bahasa Indonesia.** Label, error, toast, empty state, placeholder, button, dialog title.
- Nama variabel, fungsi, file: **English camelCase/PascalCase** (standar JS/TS).
- Nama class model/database internal: ikuti PRD — bisa Bahasa Indonesia formal PascalCase (`Pegawai`, `StrukturOrganisasi`), nama kolom snake_case (legacy DB).

## Naming

### File & Folder
| Jenis | Konvensi | Contoh |
|---|---|---|
| Komponen | PascalCase | `DataTable.tsx`, `FormDialog.tsx` |
| Page Next.js | `page.tsx` | `app/(admin)/pegawai/page.tsx` |
| Layout | `layout.tsx` | `app/(admin)/layout.tsx` |
| Hook | `use<Nama>.ts` | `usePegawai.ts`, `useReminder.ts` |
| Service | `<domain>.ts` | `kgb.ts`, `pensiun.ts` |
| Helper | `<domain>.ts` | `auth.ts`, `audit.ts`, `format.ts` |
| Validator (Zod) | `<domain>.ts` | `pegawai.ts`, `auth.ts` |
| Type | `<domain>.ts` | `database.ts`, `app.ts` |

### Variabel & Fungsi
| Jenis | Konvensi | Contoh |
|---|---|---|
| Variabel | camelCase | `pegawaiList`, `isLoading` |
| Fungsi | camelCase, verb-first | `fetchPegawai`, `hitungStatusKgb`, `validasiNik` |
| Konstanta | UPPER_SNAKE | `MAX_FILE_SIZE`, `DEBOUNCE_MS` |
| Tipe/Interface | PascalCase | `Pegawai`, `RiwayatKenaikan` |

## Error Handling

### API Error Format
```json
{
  "error": "Pesan error dalam Bahasa Indonesia",
  "details": "Detail teknis opsional — JANGAN kirim ke client di production"
}
```

### Client Error Pattern
```tsx
// Jangan try-catch kosong — selalu beri feedback ke user
try {
  await updatePegawai(id, data);
  toast.success("Data berhasil diperbarui", {
    description: "Perubahan telah tersimpan.",
  });
} catch (error) {
  toast.error("Gagal memperbarui data", {
    description: error instanceof Error ? error.message : "Terjadi kesalahan tidak dikenal.",
  });
}
```

### Multi-step Rollback
Operasi yang melibatkan beberapa langkah (create user + create pegawai) harus punya rollback:

```tsx
// Di API route
const { data: user, error: userError } = await supabase.auth.admin.createUser({...});
if (userError) throw new Error("Gagal membuat akun");

const { error: pegawaiError } = await supabase.from("pegawai").insert({...});
if (pegawaiError) {
  // Rollback: hapus user yang sudah dibuat
  await supabase.auth.admin.deleteUser(user.id);
  throw new Error("Gagal menyimpan data pegawai");
}
```

## Date & Time

- Format tampilan: `DD/MM/YYYY` (Indonesia)
- Format API: ISO 8601 (`YYYY-MM-DD`, `YYYY-MM-DDTHH:mm:ssZ`)
- Timezone: WIB/WITA/WIT — simpan sebagai UTC di DB, konversi di tampilan
- Semua kolom `date` (bukan `timestamptz`) untuk tanggal administratif: `tmt_pangkat`, `tmt_kgb`, `tanggal_lahir`

## ID & Key Handling

- `pegawai.id`: UUID v4 dari Supabase
- `profiles.id`: UUID, FK ke `auth.users.id`
- Master data ID: integer auto-increment (`SERIAL`)
- NIK: varchar 16 digit, unique
- NIP: varchar 18 digit, unique
- Jangan expose UUID di URL publik bila tidak perlu — gunakan slug atau ID pendek untuk rute publik

## Git

- Commit message: Bahasa Indonesia, imperative mood ("Tambah fitur KGB", "Perbaiki bug pensiun")
- Branch: `feature/<nama-fitur>`, `fix/<nama-bug>`, `chore/<deskripsi>`
- Jangan commit `.env` atau file berisi secret/service key
- Sebelum commit: pastikan `npm run build` sukses (atau command build project)
- Migration file: commit bersama kode yang menggunakannya

## File Upload Rules

| Aturan | Nilai |
|---|---|
| Tipe yang diizinkan | PDF, JPG, JPEG, PNG |
| Ukuran maks | 5 MB per file |
| Storage | Supabase Storage private bucket |
| Akses | Signed URL (berlaku terbatas), bukan URL publik |
| Validasi | Cek tipe & ukuran di client DAN server |

## Zod Schema Convention

```ts
import { z } from "zod";

// Schema validasi — satu file per domain di lib/validators/
export const pegawaiSchema = z.object({
  nama_lengkap: z.string().min(1, "Nama wajib diisi"),
  nik: z.string().length(16, "NIK harus 16 digit").regex(/^\d+$/, "NIK hanya berisi angka"),
  nip: z.string().length(18, "NIP harus 18 digit").optional().or(z.literal("")),
  email: z.string().email("Format email tidak valid").optional().or(z.literal("")),
  // ...
});

export type PegawaiInput = z.infer<typeof pegawaiSchema>;
```

## Checklist Sebelum Klaim Fitur Selesai

1. [ ] Requirement fungsional terpenuhi
2. [ ] Role akses benar (UI, API, RLS)
3. [ ] Loading, empty, error state ada
4. [ ] Toast sukses/error — Bahasa Indonesia + ada description
5. [ ] Validasi form berjalan (termasuk edge case)
6. [ ] Audit log tercatat (jika mengubah data pegawai)
7. [ ] Light mode & dark mode tidak rusak
8. [ ] Mobile layout tetap bisa dipakai
9. [ ] Tidak ada service key / secret di client
10. [ ] `npm run build` sukses
