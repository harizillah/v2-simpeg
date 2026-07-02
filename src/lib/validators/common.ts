import { z } from "zod";

export const nikSchema = z
  .string()
  .regex(/^\d{16}$/, "NIK harus 16 digit angka")
  .optional()
  .or(z.literal(""));

export const nipSchema = z
  .string()
  .regex(/^\d{18}$/, "NIP harus 18 digit angka")
  .optional()
  .or(z.literal(""));

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().optional(),
});

export const loginSchema = z.object({
  identifier: z
    .string()
    .min(1, "Email atau NIK harus diisi"),
  password: z
    .string()
    .min(1, "Password harus diisi"),
});

export const passwordSchema = z
  .string()
  .min(8, "Password minimal 8 karakter");
