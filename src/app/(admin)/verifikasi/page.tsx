"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatDateTime } from "@/lib/helpers/format";

const STATUS: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pending: { label: "Pending", variant: "default" },
  diterima: { label: "Diterima", variant: "secondary" },
  ditolak: { label: "Ditolak", variant: "destructive" },
};

export default function VerifikasiPage() {
  const router = useRouter();
  const [status, setStatus] = useState("");
  const sp = new URLSearchParams(); if (status) sp.set("status", status);

  const { data, isLoading } = useQuery({
    queryKey: ["verifikasi", status],
    queryFn: async () => { const res = await fetch(`/api/pengajuan-verifikasi?${sp}`); if (!res.ok) throw new Error("Gagal"); return res.json(); },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Verifikasi Pengajuan</h1>
      <div className="flex gap-3">
        <Select value={status} onValueChange={(v) => setStatus(v === "all" ? "" : (v ?? ""))}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Filter Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua</SelectItem>
            {Object.entries(STATUS).map(([k, v]) => (<SelectItem key={k} value={k}>{v.label}</SelectItem>))}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? <div className="p-4 space-y-2">{Array.from({ length: 5 }).map((_, i) => (<Skeleton key={i} className="h-14 w-full" />))}</div>
          : !data?.data?.length ? <p className="py-12 text-center text-muted-foreground">Tidak ada pengajuan</p>
          : (
            <table className="w-full">
              <thead><tr className="border-b text-left text-sm">{["Pegawai","Jenis Perubahan","Status","Tanggal","Aksi"].map(h => <th key={h} className="p-3 font-medium text-muted-foreground">{h}</th>)}</tr></thead>
              <tbody>
                {data.data.map((p: Record<string, unknown>) => {
                  const s = STATUS[String(p.status)] || { label: String(p.status), variant: "outline" as const };
                  return (
                    <tr key={String(p.id)} className="border-b text-sm hover:bg-muted/50">
                      <td className="p-3 font-medium">{(p.pegawai as { nama_lengkap?: string })?.nama_lengkap || "-"}</td>
                      <td className="p-3">{String(p.jenis_perubahan)}</td>
                      <td className="p-3"><Badge variant={s.variant}>{s.label}</Badge></td>
                      <td className="p-3 text-muted-foreground">{formatDateTime(String(p.created_at))}</td>
                      <td className="p-3"><Button size="sm" variant="outline" onClick={() => router.push(`/verifikasi/${String(p.id)}`)}>Detail</Button></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
