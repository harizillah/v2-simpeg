"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { User, Award, FileText } from "lucide-react";
import { formatDate } from "@/lib/helpers/format";

export default function PegawaiDashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["pegawai-profil"],
    queryFn: async () => {
      const res = await fetch("/api/pegawai/profil");
      if (!res.ok) throw new Error("Gagal");
      return res.json();
    },
  });

  if (isLoading) return <div className="space-y-6"><Skeleton className="h-8 w-48" /><div className="grid gap-4 md:grid-cols-3"><Skeleton className="h-32" /><Skeleton className="h-32" /><Skeleton className="h-32" /></div></div>;
  if (!data?.data) return <p className="py-12 text-center text-muted-foreground">Gagal memuat data profil</p>;

  const p = data.data;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Selamat datang, {p.nama_lengkap || "Pegawai"}.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center gap-3 pb-2">
            <User className="h-5 w-5 text-primary" />
            <CardTitle className="text-sm">Profil</CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            <p className="font-medium">{p.nama_lengkap || "-"}</p>
            <p className="text-muted-foreground">NIP: {p.nip || "-"}</p>
            <p className="text-muted-foreground">NIK: {p.nik || "-"}</p>
            <p className="text-muted-foreground">Unit: {p.struktur?.nama || "-"}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center gap-3 pb-2">
            <Award className="h-5 w-5 text-primary" />
            <CardTitle className="text-sm">Status KGB</CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            <p>TMT KGB: {p.tmt_kgb ? formatDate(p.tmt_kgb) : "Belum ada"}</p>
            <p>TMT KGB Seharusnya: {p.tmt_kgb_seharusnya ? formatDate(p.tmt_kgb_seharusnya) : "-"}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center gap-3 pb-2">
            <FileText className="h-5 w-5 text-primary" />
            <CardTitle className="text-sm">STR/SIP</CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            <p>Tenaga Medis: <Badge variant={p.is_tenaga_medis ? "default" : "secondary"}>{p.is_tenaga_medis ? "Ya" : "Tidak"}</Badge></p>
            <p>Wajib STR: <Badge variant={p.wajib_str ? "destructive" : "secondary"}>{p.wajib_str ? "Ya" : "Tidak"}</Badge></p>
            <p>Wajib SIP: <Badge variant={p.wajib_sip ? "destructive" : "secondary"}>{p.wajib_sip ? "Ya" : "Tidak"}</Badge></p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
