"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, ShieldAlert } from "lucide-react";
import { formatDate } from "@/lib/helpers/format";

async function fetchStrSip() {
  const res = await fetch("/api/monitoring/str-sip");
  if (!res.ok) throw new Error("Gagal memuat data");
  const j = await res.json();
  return j.data;
}

export default function StrSipPage() {
  const { data, isLoading } = useQuery({ queryKey: ["str-sip"], queryFn: fetchStrSip });

  if (isLoading) return <div className="space-y-6"><Skeleton className="h-8 w-48" /><Skeleton className="h-[200px] w-full" /><Skeleton className="h-[200px] w-full" /></div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Monitoring STR / SIP</h1>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2 text-base"><AlertTriangle className="h-4 w-4 text-yellow-500" />Akan Kedaluwarsa (6 Bulan)</CardTitle></CardHeader>
          <CardContent>
            {data?.akanKedaluwarsa?.length === 0 ? (
              <p className="py-8 text-center text-muted-foreground">Tidak ada STR/SIP yang akan kedaluwarsa dalam 6 bulan</p>
            ) : (
              <div className="space-y-3">
                {data?.akanKedaluwarsa?.map((s: Record<string, unknown>) => (
                  <div key={String(s.id)} className="flex justify-between rounded-lg border p-3">
                    <div>
                      <Link href={`/pegawai/${s.pegawai_id}`} className="font-medium hover:underline">
                        {(s.pegawai as { nama_lengkap?: string })?.nama_lengkap || "-"}
                      </Link>
                      <p className="text-sm text-muted-foreground">
                        <Badge variant="outline" className="mr-1 text-xs">{String(s.jenis_sertifikat)}</Badge>
                        {String(s.nama_kegiat_an || "-")}
                      </p>
                      <p className="text-xs text-muted-foreground">Unit: {(s.pegawai as { struktur?: { nama?: string }[] })?.struktur?.[0]?.nama || "-"}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-yellow-600">Berlaku hingga</p>
                      <p className="text-sm">{formatDate(String(s.berlaku_hingga))}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2 text-base"><ShieldAlert className="h-4 w-4 text-red-500" />Sudah Kedaluwarsa</CardTitle></CardHeader>
          <CardContent>
            {data?.sudahKedaluwarsa?.length === 0 ? (
              <p className="py-8 text-center text-muted-foreground">Tidak ada STR/SIP yang sudah kedaluwarsa</p>
            ) : (
              <div className="space-y-3">
                {data?.sudahKedaluwarsa?.map((s: Record<string, unknown>) => (
                  <div key={String(s.id)} className="flex justify-between rounded-lg border border-destructive/30 p-3">
                    <div>
                      <Link href={`/pegawai/${s.pegawai_id}`} className="font-medium hover:underline">
                        {(s.pegawai as { nama_lengkap?: string })?.nama_lengkap || "-"}
                      </Link>
                      <p className="text-sm text-muted-foreground">
                        <Badge variant="outline" className="mr-1 text-xs">{String(s.jenis_sertifikat)}</Badge>
                        {String(s.nama_kegiat_an || "-")}
                      </p>
                      <p className="text-xs text-muted-foreground">Unit: {(s.pegawai as { struktur?: { nama?: string }[] })?.struktur?.[0]?.nama || "-"}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-destructive">Kedaluwarsa</p>
                      <p className="text-sm">{formatDate(String(s.berlaku_hingga))}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
