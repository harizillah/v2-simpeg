"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { usePegawaiList, useSoftDeletePegawai } from "@/hooks/use-pegawai";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Plus, Search, Pencil, Trash2, Users } from "lucide-react";
import { useDebounce } from "@/hooks/use-debounce";

export default function PegawaiListPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebounce(search, 300);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data, isLoading, error } = usePegawaiList({
    search: debouncedSearch || undefined,
    page,
    limit: 10,
  });

  const softDelete = useSoftDeletePegawai();

  const handleDelete = async () => {
    if (!deleteId) return;
    await softDelete.mutateAsync(deleteId);
    setDeleteId(null);
  };

  if (error) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">Gagal memuat data pegawai. Silakan muat ulang halaman.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Pegawai</h1>
          <p className="text-muted-foreground">Kelola data pegawai RSUD.</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => router.push("/pegawai/tambah")}>
            <Plus className="mr-2 h-4 w-4" />
            Tambah Pegawai
          </Button>
          <Button variant="outline" onClick={() => router.push("/pegawai/inaktif")}>
            <Trash2 className="mr-2 h-4 w-4" />
            Arsip
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle>Daftar Pegawai Aktif</CardTitle>
          <div className="relative w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cari nama, NIP, NIK..."
              className="pl-8"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>
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
              <Users className="mb-4 h-12 w-12 text-muted-foreground" />
              <p className="text-muted-foreground">
                {debouncedSearch ? "Tidak ada pegawai yang cocok dengan pencarian" : "Belum ada data pegawai"}
              </p>
              {!debouncedSearch && (
                <Button className="mt-4" onClick={() => router.push("/pegawai/tambah")}>
                  Tambah Pegawai Pertama
                </Button>
              )}
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nama</TableHead>
                    <TableHead>NIP</TableHead>
                    <TableHead>Unit Kerja</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-24">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.data.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">
                        <Link href={`/pegawai/${p.id}`} className="hover:underline">
                          {p.nama_lengkap}
                        </Link>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{p.nip || "-"}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {(p as { struktur?: { nama?: string } }).struktur?.nama || "-"}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {(p as { status_pegawai?: { nama?: string } }).status_pegawai?.nama || (p as { status_kepegawaian?: { nama?: string } }).status_kepegawaian?.nama || "-"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button size="icon" variant="ghost" onClick={() => router.push(`/pegawai/${p.id}`)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => setDeleteId(p.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {data.count > 10 && (
                <div className="flex items-center justify-between pt-4">
                  <p className="text-sm text-muted-foreground">
                    Menampilkan {(page - 1) * 10 + 1}–{Math.min(page * 10, data.count)} dari {data.count}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page <= 1}
                      onClick={() => setPage((p) => p - 1)}
                    >
                      Sebelumnya
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page * 10 >= data.count}
                      onClick={() => setPage((p) => p + 1)}
                    >
                      Berikutnya
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nonaktifkan Pegawai</DialogTitle>
            <DialogDescription>
              Pegawai akan dipindahkan ke arsip dan tidak muncul di daftar aktif.
              Data dapat dipulihkan kembali.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>
              Batal
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={softDelete.isPending}>
              {softDelete.isPending ? "Menonaktifkan..." : "Nonaktifkan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
