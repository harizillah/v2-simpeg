"use client";

import { useQuery } from "@tanstack/react-query";

interface DashboardStats {
  totalAktif: number;
  totalPns: number;
  totalMedis: number;
  rasioGender: { laki: number; perempuan: number };
  topUnit: { nama: string; jumlah: number }[];
  aktivitasTerbaru: Array<{
    id: string;
    change_type: string;
    pegawai: string | null;
    changed_by_name: string;
    created_at: string;
  }>;
}

async function fetchDashboard(): Promise<DashboardStats> {
  const res = await fetch("/api/dashboard");
  if (!res.ok) throw new Error("Gagal memuat dashboard");
  const json = await res.json();
  return json.data;
}

export function useDashboard() {
  return useQuery({
    queryKey: ["dashboard"],
    queryFn: fetchDashboard,
  });
}
