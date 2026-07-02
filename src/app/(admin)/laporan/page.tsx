"use client";

import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Users, Calendar, TrendingUp, FileClock, BarChart3, PieChart, List } from "lucide-react";

const LAPORAN = [
  { label: "DUK", href: "/laporan/duk", icon: List, desc: "Daftar Urut Kepangkatan" },
  { label: "Jenis Tenaga", href: "/laporan/jenis-tenaga", icon: Users, desc: "Rekap pegawai per jenis tenaga" },
  { label: "Pensiun", href: "/laporan/pensiun", icon: Calendar, desc: "Pegawai mendekati masa pensiun" },
  { label: "Kenaikan Pangkat", href: "/laporan/pangkat", icon: TrendingUp, desc: "Estimasi kenaikan pangkat" },
  { label: "KGB", href: "/laporan/kgb", icon: BarChart3, desc: "Status kenaikan gaji berkala" },
  { label: "Kontrak", href: "/laporan/kontrak", icon: FileClock, desc: "Masa akhir kontrak pegawai" },
  { label: "Bezzeting", href: "/laporan/bezzeting", icon: PieChart, desc: "Rekap kekuatan pegawai per unit" },
  { label: "Komposisi", href: "/laporan/komposisi", icon: FileText, desc: "Komposisi pegawai detail" },
];

export default function LaporanPage() {
  const router = useRouter();
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Laporan</h1>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {LAPORAN.map((l) => (
          <Card key={l.href} className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => router.push(l.href)}>
            <CardHeader className="flex flex-row items-center gap-3 pb-2">
              <l.icon className="h-5 w-5 text-primary" />
              <CardTitle className="text-base">{l.label}</CardTitle>
            </CardHeader>
            <CardContent><p className="text-sm text-muted-foreground">{l.desc}</p></CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
