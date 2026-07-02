# Frontend — SIMPEG RSUD

## Tech Stack

- Next.js App Router
- Tailwind CSS + shadcn/ui
- Lucide React (icons)
- Recharts (charts)
- Sonner (toast)
- TanStack Query (data fetching & cache)

## Konvensi Komponen

### Hierarki Komponen

```
page.tsx              ← Server component (bila memungkinkan)
├── PageClient.tsx     ← "use client" wrapper — data fetching + state
│   ├── FilterBar      ← Filter, search, action buttons
│   ├── DataTable      ← Tabel shadcn/ui: sort, pagination
│   ├── DetailDrawer   ← Detail pegawai, slide dari kanan
│   ├── FormDialog     ← Create/edit form dalam dialog
│   └── ExportButton   ← Export Excel/PDF
```

### "use client" Rules

- Default: tulis sebagai server component
- Tambahkan `"use client"` hanya jika: butuh state (useState), effect (useEffect), browser API, event handler, atau context
- Komponen interaktif (form, tabel, chart) = `"use client"`
- Layout & static content = server component

### Naming

- File komponen: PascalCase (`DataTable.tsx`, `FormDialog.tsx`)
- Halaman: `page.tsx` (Next.js convention)
- Layout: `layout.tsx`
- Hooks: `use<Nama>.ts` (`usePegawai.ts`, `useAuth.ts`)
- Shared components ada di `components/shared/`

## Design System (shadcn/ui + Tailwind)

### Komponen shadcn/ui Wajib

| Komponen | Penggunaan |
|---|---|
| Button | Semua aksi. Variants: default, destructive, outline, ghost |
| Input | Text, number, date |
| Select | Dropdown pilihan |
| Checkbox | Pilihan boolean |
| Dialog | Form create/edit, konfirmasi |
| Table | Semua data list |
| Badge | Status: aktif/nonaktif, pending/diterima/ditolak |
| Card | Container konten dashboard |
| Tabs | Navigasi konten dalam halaman |
| Skeleton | Loading state |
| Tooltip | Informasi tambahan pada icon/teks |
| Popover | Quick action, filter dropdown |
| Calendar | Date picker input |

### Tailwind CSS Rules

- Gunakan utility class Tailwind, jangan inline style atau CSS module kecuali tidak ada jalan lain
- Responsive: mobile-first — `md:`, `lg:` breakpoint
- Jangan pakai arbitrary value `w-[327px]` kecuali benar-benar tidak ada Tailwind class yang cocok
- Dark mode: tidak ada class `dark:` manual — pakai shadcn/ui theme variables

## Toast (Sonner)

**WAJIB ada `description` di setiap toast. Tidak boleh hanya `title`.**

```tsx
// ✅ Benar
toast.success("Data pegawai berhasil disimpan", {
  description: "Perubahan akan tercatat di audit log.",
});

// ❌ Salah — tidak ada description
toast.success("Berhasil");
```

Semua teks toast: Bahasa Indonesia.

## Loading, Empty, Error State

Setiap halaman data WAJIB implementasi 3 state:

### Loading
```tsx
if (isLoading) return <Skeleton className="h-96 w-full" />;
```

### Empty
```tsx
if (!data || data.length === 0) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-2 py-12">
        <Inbox className="h-12 w-12 text-muted-foreground" />
        <p className="text-muted-foreground">Belum ada data pegawai</p>
      </CardContent>
    </Card>
  );
}
```

### Error
```tsx
if (error) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-2 py-12">
        <AlertCircle className="h-12 w-12 text-destructive" />
        <p className="text-destructive">Gagal memuat data</p>
        <Button variant="outline" onClick={refetch}>Coba Lagi</Button>
      </CardContent>
    </Card>
  );
}
```

## TanStack Query Pattern

```tsx
// hooks/use-pegawai.ts
export function usePegawaiList(filter: PegawaiFilter) {
  return useQuery({
    queryKey: ["pegawai", filter],
    queryFn: () => fetchPegawai(filter),
  });
}

export function usePegawaiMutations() {
  const queryClient = useQueryClient();

  const create = useMutation({
    mutationFn: createPegawai,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pegawai"] });
      toast.success("Pegawai berhasil ditambahkan", {
        description: "Data pegawai telah tersimpan.",
      });
    },
    onError: (error) => {
      toast.error("Gagal menambahkan pegawai", {
        description: error.message,
      });
    },
  });

  return { create };
}
```

## Form Pattern

```tsx
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const schema = z.object({
  nama_lengkap: z.string().min(1, "Nama wajib diisi"),
  nik: z.string().length(16, "NIK harus 16 digit"),
  email: z.string().email("Format email tidak valid").optional().or(z.literal("")),
});

type FormData = z.infer<typeof schema>;

// Komponen form pakai shadcn/ui Form + react-hook-form
```

## Table Pattern

- DataTable: generic, nerima columns definition + data
- Kolom sortable (ASC/DESC)
- Pagination server-side untuk data >100 rows
- Search bar dengan debounce 300ms
- Column visibility toggle untuk tabel lebar
- Export button di kanan atas tabel

## Dashboard Chart (Recharts)

- BarChart: komposisi pegawai per unit kerja
- PieChart: rasio tenaga medis/non-medis
- LineChart: tren (jika dibutuhkan nanti)
- Warna chart pakai Tailwind color variables, bukan hardcode hex

## Aksesibilitas

- Icon-only button: **wajib `aria-label`** — "Edit pegawai", "Hapus data"
- Form input: **wajib `<label>`** terhubung ke input via `htmlFor`
- Focus ring: terlihat jelas di semua elemen interaktif
- Tabel: tetap dapat discroll horizontal di mobile
- Kontras: validasi di light & dark mode, tidak ada teks abu-abu terang di atas putih

## Responsive

- Sidebar: collapse ke hamburger di mobile
- Tabel: horizontal scroll di viewport kecil
- Form: stack vertikal di mobile, inline di desktop
- Dashboard cards: 1 kolom mobile, 2 tablet, 4 desktop
