"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useDashboard } from "@/hooks/use-dashboard";
import { formatDateTime } from "@/lib/helpers/format";
import { Users, UserCheck, Stethoscope, Building2, Clock } from "lucide-react";

export default function AdminDashboardPage() {
  const { data, isLoading, error } = useDashboard();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Gagal memuat data dashboard. Silakan muat ulang halaman.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const stats = [
    { label: "Total Pegawai Aktif", value: data.totalAktif, icon: Users, color: "text-blue-600" },
    { label: "PNS", value: data.totalPns, icon: UserCheck, color: "text-green-600" },
    { label: "Tenaga Medis", value: data.totalMedis, icon: Stethoscope, color: "text-purple-600" },
    {
      label: "Laki-laki / Perempuan",
      value: `${data.rasioGender.laki} / ${data.rasioGender.perempuan}`,
      icon: Users,
      color: "text-orange-600",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Selamat datang di Sistem Informasi Manajemen Kepegawaian RSUD.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.label}
              </CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                {typeof stat.value === "number" ? stat.value.toLocaleString("id-ID") : stat.value}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Top Unit & Aktivitas */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Top 10 Unit */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Building2 className="h-4 w-4" />
              10 Unit Teratas
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.topUnit.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-8">
                Belum ada data pegawai
              </p>
            ) : (
              <div className="space-y-2">
                {data.topUnit.map((unit, i) => (
                  <div key={unit.nama} className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 truncate">
                      <Badge variant="secondary" className="h-5 w-5 rounded-full p-0 text-xs">
                        {i + 1}
                      </Badge>
                      {unit.nama}
                    </span>
                    <span className="font-medium">{unit.jumlah}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Aktivitas Terbaru */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Clock className="h-4 w-4" />
              Aktivitas Terbaru
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.aktivitasTerbaru.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-8">
                Belum ada aktivitas
              </p>
            ) : (
              <div className="space-y-3">
                {data.aktivitasTerbaru.map((log) => (
                  <div key={log.id} className="flex items-start gap-2 text-sm">
                    <Badge
                      variant={log.change_type === "DELETE" ? "destructive" : log.change_type === "INSERT" ? "default" : "secondary"}
                      className="shrink-0 text-xs"
                    >
                      {log.change_type}
                    </Badge>
                    <div className="min-w-0">
                      <p className="truncate font-medium">
                        {log.pegawai ?? "Pegawai"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        oleh {log.changed_by_name} — {formatDateTime(log.created_at)}
                      </p>
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
