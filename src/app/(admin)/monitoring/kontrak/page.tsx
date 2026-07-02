"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate } from "@/lib/helpers/format";

const STATUS_BADGE: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  normal: { label: "Normal", variant: "secondary" },
  warning: { label: "Warning", variant: "default" },
  overdue: { label: "Overdue", variant: "destructive" },
  no_data: { label: "Belum ada TMT", variant: "outline" },
};

export default function KontrakPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useQuery({
    queryKey: ["kontrak", page],
    queryFn: async () => { const res = await fetch(`/api/monitoring/kontrak?page=${page}&limit=20`); if (!res.ok) throw new Error("Gagal"); return res.json(); },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Monitoring Kontrak</h1>
      <Card>
        <CardContent className="p-0">
          {isLoading ? <div className="p-4 space-y-2">{Array.from({ length: 5 }).map((_, i) => (<Skeleton key={i} className="h-12 w-full" />))}</div>
          : !data?.data?.length ? <p className="py-12 text-center text-muted-foreground">Tidak ada data</p>
          : (
            <table className="w-full">
              <thead><tr className="border-b text-left text-sm">{["Nama","Status","TMT Awal","TMT Akhir","Sisa","Unit","Status"].map(h => <th key={h} className="p-3 font-medium text-muted-foreground">{h}</th>)}</tr></thead>
              <tbody>
                {data.data.map((p: Record<string, unknown>) => {
                  const s = STATUS_BADGE[String(p.status_kontrak)] || STATUS_BADGE.no_data;
                  return (
                    <tr key={String(p.id)} className="border-b text-sm hover:bg-muted/50">
                      <td className="p-3"><Link href={`/pegawai/${p.id}`} className="font-medium hover:underline">{String(p.nama_lengkap)}</Link></td>
                      <td className="p-3 text-muted-foreground">{String((p.status_pegawai as { nama?: string })?.nama || "-")}</td>
                      <td className="p-3">{p.tmt_awal ? formatDate(String(p.tmt_awal)) : "-"}</td>
                      <td className="p-3">{p.tmt_akhir ? formatDate(String(p.tmt_akhir)) : "-"}</td>
                      <td className="p-3">{p.sisa_hari ? `${p.sisa_hari} hari` : "-"}</td>
                      <td className="p-3 text-muted-foreground">{String((p.struktur as { nama?: string }[])?.[0]?.nama || "-")}</td>
                      <td className="p-3"><Badge variant={s.variant}>{s.label}</Badge></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
      {data?.count > 20 && (
        <div className="flex justify-between">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Sebelumnya</Button>
          <Button variant="outline" size="sm" disabled={page * 20 >= data.count} onClick={() => setPage(p => p + 1)}>Berikutnya</Button>
        </div>
      )}
    </div>
  );
}
