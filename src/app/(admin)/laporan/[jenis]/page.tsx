"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Download } from "lucide-react";

const LABELS: Record<string, string> = {
  duk: "DUK (Daftar Urut Kepangkatan)",
  "jenis-tenaga": "Laporan Jenis Tenaga",
  pensiun: "Laporan Pensiun",
  pangkat: "Laporan Kenaikan Pangkat",
  kgb: "Laporan KGB",
  kontrak: "Laporan Kontrak",
  bezzeting: "Bezzeting Dasar",
  komposisi: "Komposisi Pegawai",
};

export default function LaporanDetailPage({ params }: { params: Promise<{ jenis: string }> }) {
  const { jenis } = use(params);
  const router = useRouter();
  const { data, isLoading } = useQuery({
    queryKey: ["laporan", jenis],
    queryFn: async () => {
      const res = await fetch(`/api/laporan/${jenis}`);
      if (!res.ok) throw new Error("Gagal");
      return res.json();
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push("/laporan")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold">{LABELS[jenis] || jenis}</h1>
        </div>
        <Button onClick={() => window.open(`/api/laporan/${jenis}?export=xlsx`, "_blank")}>
          <Download className="mr-2 h-4 w-4" />
          Export Excel
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4 space-y-2">{Array.from({ length: 5 }).map((_, i) => (<Skeleton key={i} className="h-10 w-full" />))}</div>
          ) : !data?.data?.length ? (
            <p className="py-12 text-center text-muted-foreground">Tidak ada data</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b text-left text-sm">
                    {Object.keys(data.data[0] as Record<string, unknown>).filter(k => !k.startsWith("_")).map((k) => (
                      <th key={k} className="p-3 font-medium text-muted-foreground whitespace-nowrap">{k.replace(/_/g, " ")}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(data.data as Record<string, unknown>[]).map((row: Record<string, unknown>, i: number) => (
                    <tr key={i} className="border-b text-sm hover:bg-muted/50">
                      {Object.entries(row).filter(([k]) => !k.startsWith("_")).map(([k, v]) => (
                        <td key={k} className="p-3 whitespace-nowrap">{String(v ?? "-")}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
