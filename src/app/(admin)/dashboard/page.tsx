import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminDashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Selamat datang di Sistem Informasi Manajemen Kepegawaian RSUD.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Pegawai
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">&mdash;</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              KGB Bulan Ini
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">&mdash;</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Kenaikan Pangkat
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">&mdash;</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pensiun 6 Bulan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">&mdash;</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
