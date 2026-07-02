"use client";

import { useQuery } from "@tanstack/react-query";
import type { MasterTable } from "@/lib/services/master-data";

export function useMasterData(table: MasterTable) {
  return useQuery({
    queryKey: ["master-data", table],
    queryFn: async () => {
      const res = await fetch(`/api/master-data?table=${table}`);
      if (!res.ok) throw new Error("Gagal memuat data master");
      const json = await res.json();
      return json.data as unknown[];
    },
  });
}
