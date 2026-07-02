"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { usePegawaiList, useRestorePegawai } from "@/hooks/use-pegawai";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowLeft, RotateCcw, Archive } from "lucide-react";

export default function PegawaiInaktifPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const { data, isLoading } = usePegawaiList({ isDeleted: true, page, limit: 10 });
  const restorePegawai = useRestorePegawai();

  const handleRestore = async (id: string) => {
    await restorePegawai.mutateAsync(id);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push("/pegawai")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold tracking-tight">Arsip Pegawai</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pegawai Inaktif</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : !data?.data || data.data.length === 0 ? (
            <div className="flex flex-col items-center py-12 text-center">
              <Archive className="mb-4 h-12 w-12 text-muted-foreground" />
              <p className="text-muted-foreground">Tidak ada pegawai inaktif</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama</TableHead>
                  <TableHead>NIP</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-24">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.data.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.nama_lengkap}</TableCell>
                    <TableCell className="text-muted-foreground">{p.nip || "-"}</TableCell>
                    <TableCell>
                      <Badge variant="destructive">Inaktif</Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRestore(p.id)}
                        disabled={restorePegawai.isPending}
                      >
                        <RotateCcw className="mr-1 h-3 w-3" />
                        Pulihkan
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
