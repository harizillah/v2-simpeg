"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatDate } from "@/lib/helpers/format";

const STATUS_MAP: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  normal: { label: "Normal", variant: "secondary" },
  warning: { label: "Warning", variant: "default" },
  overdue: { label: "Overdue", variant: "destructive" },
  no_data: { label: "No Data", variant: "outline" },
};

export default function KgbPage() {
  const [status, setStatus] = useState<string>("");
  const [page, setPage] = useState(1);

  const sp = new URLSearchParams();
  if (status) sp.set("status", status);
  sp.set("page", String(page));
  sp.set("limit", "20");

  const { data, isLoading } = useQuery({
    queryKey: ["kgb", status, page],
    queryFn: async () => {
      const res = await fetch(`/api/monitoring/kgb?${sp}`);
      if (!res.ok) throw new Error("Gagal");
      return res.json();
    },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Monitoring KGB</h1>

      {data?.statistik && (
        <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
          {(["total", "normal", "warning", "overdue"] as const).map((k) => (
            <Card key={k}>
              <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground capitalize">{k}</CardTitle></CardHeader>
              <CardContent><p className="text-2xl font-bold">{data.statistik[k]}</p></CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="flex items-center gap-3">
        <Select value={status} onValueChange={(v) => { setStatus(v === "all" ? "" : (v ?? "")); setPage(1); }}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Filter Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua</SelectItem>
            {Object.entries(STATUS_MAP).map(([k, v]) => (<SelectItem key={k} value={k}>{v.label}</SelectItem>))}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4 space-y-2">{Array.from({ length: 5 }).map((_, i) => (<Skeleton key={i} className="h-12 w-full" />))}</div>
          ) : !data?.data?.length ? (
            <p className="py-12 text-center text-muted-foreground">Tidak ada data</p>
          ) : (
            <table className="w-full">
              <thead><tr className="border-b text-left text-sm">{["Nama","NIP","Golongan","Unit","KGB Berikutnya","Status"].map(h => <th key={h} className="p-3 font-medium text-muted-foreground">{h}</th>)}</tr></thead>
              <tbody>
                {data.data.map((p: Record<string, unknown>) => {
                  const s = STATUS_MAP[p.status_kgb as string] || STATUS_MAP.no_data;
                  return (
                    <tr key={String(p.id)} className="border-b text-sm hover:bg-muted/50">
                      <td className="p-3"><Link href={`/pegawai/${p.id}`} className="font-medium hover:underline">{String(p.nama_lengkap)}</Link></td>
                      <td className="p-3 text-muted-foreground">{String(p.nip || "-")}</td>
                      <td className="p-3 text-muted-foreground">{String((p.golongan as { nama?: string })?.nama || "-")}</td>
                      <td className="p-3 text-muted-foreground">{String((p.struktur as { nama?: string }[])?.[0]?.nama || "-")}</td>
                      <td className="p-3">{p.kgb_berikutnya ? formatDate(String(p.kgb_berikutnya)) : "-"}</td>
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
