"use client";

import { useState } from "react";
import { useMasterData } from "@/hooks/use-master-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { MasterTable } from "@/lib/services/master-data";

const TABLES: { key: MasterTable; label: string }[] = [
  { key: "struktur_organisasi", label: "Struktur Organisasi" },
  { key: "golongan", label: "Golongan" },
  { key: "status_pegawai", label: "Status Pegawai" },
  { key: "jabatan_fungsional", label: "Jabatan Fungsional" },
  { key: "jabatan_rs", label: "Jabatan RS" },
  { key: "master_kategori_tenaga", label: "Kategori Tenaga" },
  { key: "master_jenis_tenaga", label: "Jenis Tenaga" },
  { key: "master_tingkat_pendidikan", label: "Tingkat Pendidikan" },
  { key: "master_universitas", label: "Universitas" },
  { key: "master_jurusan", label: "Jurusan" },
];

export default function MasterDataPage() {
  const [activeTab, setActiveTab] = useState<MasterTable>("golongan");
  const { data, isLoading } = useMasterData(activeTab);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Master Data</h1>
        <p className="text-muted-foreground">Kelola data referensi sistem.</p>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as MasterTable)}>
        <TabsList className="flex-wrap">
          {TABLES.map((t) => (
            <TabsTrigger key={t.key} value={t.key}>
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {TABLES.map((t) => (
          <TabsContent key={t.key} value={t.key}>
            <Card>
              <CardHeader>
                <CardTitle>{t.label}</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-2">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Skeleton key={i} className="h-12 w-full" />
                    ))}
                  </div>
                ) : !data || data.length === 0 ? (
                  <p className="py-8 text-center text-muted-foreground">
                    Belum ada data {t.label.toLowerCase()}
                  </p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {Object.keys(data[0] as Record<string, unknown>)
                          .filter((k) => !k.startsWith("created_at") && !k.startsWith("updated_at") && k !== "id")
                          .map((key) => (
                            <TableHead key={key}>
                              {key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                            </TableHead>
                          ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.map((item) => {
                        const row = item as Record<string, unknown>;
                        return (
                          <TableRow key={String(row.id)}>
                            {Object.keys(row)
                              .filter((k) => !k.startsWith("created_at") && !k.startsWith("updated_at") && k !== "id")
                              .map((key) => (
                                <TableCell key={key}>
                                  {row[key] !== null && row[key] !== undefined
                                    ? String(row[key])
                                    : "-"}
                                </TableCell>
                              ))}
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
