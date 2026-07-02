import { format, parseISO } from "date-fns";
import { id } from "date-fns/locale";

export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return "-";
  const d = typeof date === "string" ? parseISO(date) : date;
  return format(d, "dd MMMM yyyy", { locale: id });
}

export function formatDateShort(date: string | Date | null | undefined): string {
  if (!date) return "-";
  const d = typeof date === "string" ? parseISO(date) : date;
  return format(d, "dd/MM/yyyy", { locale: id });
}

export function formatDateTime(date: string | Date | null | undefined): string {
  if (!date) return "-";
  const d = typeof date === "string" ? parseISO(date) : date;
  return format(d, "dd MMMM yyyy HH:mm", { locale: id });
}

export function hitungUsia(tanggalLahir: string | Date): number {
  const lahir = typeof tanggalLahir === "string" ? new Date(tanggalLahir) : tanggalLahir;
  const sekarang = new Date();
  let usia = sekarang.getFullYear() - lahir.getFullYear();
  const bulan = sekarang.getMonth() - lahir.getMonth();
  if (bulan < 0 || (bulan === 0 && sekarang.getDate() < lahir.getDate())) {
    usia--;
  }
  return usia;
}

export function getStatusKgb(
  tmtKgbBerikutnya: string | Date | null
): "normal" | "warning" | "overdue" | "no_data" {
  if (!tmtKgbBerikutnya) return "no_data";

  const sekarang = new Date();
  const tgl = typeof tmtKgbBerikutnya === "string" ? new Date(tmtKgbBerikutnya) : tmtKgbBerikutnya;

  const tigaBulan = new Date(sekarang);
  tigaBulan.setMonth(sekarang.getMonth() + 3);

  if (tgl < sekarang) return "overdue";
  if (tgl <= tigaBulan) return "warning";
  return "normal";
}

export function getStatusKontrak(
  tmtAkhir: string | Date | null
): "normal" | "warning" | "overdue" | "no_data" {
  if (!tmtAkhir) return "no_data";

  const sekarang = new Date();
  const tgl = typeof tmtAkhir === "string" ? new Date(tmtAkhir) : tmtAkhir;

  const tigaBulan = new Date(sekarang);
  tigaBulan.setMonth(sekarang.getMonth() + 3);

  if (tgl < sekarang) return "overdue";
  if (tgl <= tigaBulan) return "warning";
  return "normal";
}
