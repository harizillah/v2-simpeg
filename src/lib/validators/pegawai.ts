import { z } from "zod";
import { nikSchema, nipSchema } from "./common";

export const pegawaiSchema = z.object({
  nik: nikSchema,
  nip: nipSchema,
  nama_lengkap: z.string().min(1, "Nama lengkap harus diisi"),
  email: z.string().email("Format email tidak valid").optional().or(z.literal("")),
  no_kk: z.string().max(16).optional().or(z.literal("")),
  tempat_lahir: z.string().optional().or(z.literal("")),
  tanggal_lahir: z.string().optional().or(z.literal("")),
  jenis_kelamin: z.enum(["Laki-laki", "Perempuan"]).optional().or(z.literal("")),
  agama: z.string().optional().or(z.literal("")),
  status_pernikahan: z.string().optional().or(z.literal("")),
  alamat: z.string().optional().or(z.literal("")),
  telepon: z.string().optional().or(z.literal("")),
  status_kepegawaian_id: z.coerce.number().int().positive().optional().nullable(),
  struktur_organisasi_id: z.coerce.number().int().positive().optional().nullable(),
  jabatan_fungsional_id: z.coerce.number().int().positive().optional().nullable(),
  jenis_tenaga_id: z.coerce.number().int().positive().optional().nullable(),
  eselon: z.string().optional().or(z.literal("")),
  golongan_id: z.coerce.number().int().positive().optional().nullable(),
  golongan_cpns_id: z.coerce.number().int().positive().optional().nullable(),
  tmt_pangkat: z.string().optional().or(z.literal("")),
  tmt_jabatan: z.string().optional().or(z.literal("")),
  tmt_cpns: z.string().optional().or(z.literal("")),
  tmt_awal: z.string().optional().or(z.literal("")),
  tmt_akhir: z.string().optional().or(z.literal("")),
  tmt_kgb: z.string().optional().or(z.literal("")),
  tmt_kgb_seharusnya: z.string().optional().or(z.literal("")),
  is_tenaga_medis: z.coerce.boolean().default(false),
  wajib_str: z.coerce.boolean().default(false),
  wajib_sip: z.coerce.boolean().default(false),
  buat_akun: z.coerce.boolean().default(false),
  password: z.string().min(8, "Password minimal 8 karakter").optional().or(z.literal("")),
});

export type PegawaiFormValues = z.infer<typeof pegawaiSchema>;
