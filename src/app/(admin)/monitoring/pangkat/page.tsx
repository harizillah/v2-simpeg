"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatDate } from "@/lib/helpers/format";

export default function PangkatPage() {
  const [tahun, setTahun] = useState(new Date().getFullYear());
  const [page, setPage] = useState(1);

  const sp = new URLSearchParams({ tahun: String(tahun), page: String(page), limit: "20" });
  const { data, isLoading } = useQuery({
    queryKey: ["pangkat", tahun, page],
    queryFn: async () => { const res = await fetch(`/api/monitoring/pangkat?${sp}`); if (!res.ok) throw new Error("Gagal"); return res.json(); },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Monitoring Kenaikan Pangkat</h1>

      <div className="flex items-center gap-3">
        <Select value={String(tahun)} onValueChange={(v) => { setTahun(Number(v)); setPage(1); }}>
          <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
          <SelectContent>
            {Array.from({ length: 10 }).map((_, i) => { const y = new Date().getFullYear() - 2 + i; return (<SelectItem key={y} value={String(y)}>{y}</SelectItem>); })}
          </SelectContent>
        </Select>
      </div>

      <p className="text-sm text-muted-foreground">Estimasi default: TMT Pangkat + 4 tahun. Hanya PNS & PPPK.</p>

      <Card>
        <CardContent className="p-0">
          {isLoading ? <div className="p-4 space-y-2">{Array.from({ length: 5 }).map((_, i) => (<Skeleton key={i} className="h-12 w-full" />))}</div>
          : !data?.data?.length ? <p className="py-12 text-center text-muted-foreground">Tidak ada pegawai dengan estimasi kenaikan pangkat tahun {tahun}</p>
          : (
            <table className="w-full">
              <thead><tr className="border-b text-left text-sm">{["Nama","NIP","Golongan","TMT Pangkat","Estimasi","Unit"].map(h => <th key={h} className="p-3 font-medium text-muted-foreground">{h}</th>)}</tr></thead>
              <tbody>
                {data.data.map((p: Record<string, unknown>) => (
                  <tr key={String(p.id)} className="border-b text-sm hover:bg-muted/50">
                    <td className="p-3"><Link href={`/pegawai/${p.id}`} className="font-medium hover:underline">{String(p.nama_lengkap)}</Link></td>
                    <td className="p-3 text-muted-foreground">{String(p.nip || "-")}</td>
                    <td className="p-3">{String((p.golongan as { nama?: string })?.nama || "-")}</td>
                    <td className="p-3">{formatDate(String(p.tmt_pangkat))}</td>
                    <td className="p-3 text-sm">{formatDate(String(p.estimasi_pangkat))}</td>
                    <td className="p-3 text-muted-foreground">{String((p.struktur as { nama?: string }[])?.[0]?.nama || "-")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
