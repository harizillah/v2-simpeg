"use client";

import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Users, Calendar, FileClock, TrendingUp } from "lucide-react";

const items = [
  { label: "STR / SIP", href: "/monitoring/str-sip", icon: AlertTriangle, desc: "Monitoring masa berlaku STR dan SIP tenaga medis" },
  { label: "KGB", href: "/monitoring/kgb", icon: TrendingUp, desc: "Monitoring kenaikan gaji berkala PNS & PPPK" },
  { label: "Pensiun", href: "/monitoring/pensiun", icon: Calendar, desc: "Monitoring pegawai mendekati BUP (Batas Usia Pensiun)" },
  { label: "Kontrak", href: "/monitoring/kontrak", icon: FileClock, desc: "Monitoring masa akhir kontrak PPPK/honorer/kontrak" },
  { label: "Kenaikan Pangkat", href: "/monitoring/pangkat", icon: Users, desc: "Monitoring estimasi kenaikan pangkat PNS & PPPK" },
];

export default function MonitoringPage() {
  const router = useRouter();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Monitoring</h1>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <Card key={item.href} className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => router.push(item.href)}>
            <CardHeader className="flex flex-row items-center gap-3 pb-2">
              <item.icon className="h-5 w-5 text-primary" />
              <CardTitle className="text-base">{item.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{item.desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
