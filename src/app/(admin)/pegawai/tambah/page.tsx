"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCreatePegawai } from "@/hooks/use-pegawai";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Loader2 } from "lucide-react";

export default function TambahPegawaiPage() {
  const router = useRouter();
  const createPegawai = useCreatePegawai();
  const [form, setForm] = useState({
    nama_lengkap: "",
    nik: "",
    nip: "",
    email: "",
    tempat_lahir: "",
    tanggal_lahir: "",
    jenis_kelamin: "",
    telepon: "",
    alamat: "",
  });

  const handleChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await createPegawai.mutateAsync(form);
    if (result.data?.id) {
      router.push(`/pegawai/${result.data.id}`);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push("/pegawai")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold tracking-tight">Tambah Pegawai</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Identitas Pegawai</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="nama_lengkap">
                  Nama Lengkap <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="nama_lengkap"
                  value={form.nama_lengkap}
                  onChange={handleChange("nama_lengkap")}
                  required
                  placeholder="Nama lengkap pegawai"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="nik">NIK</Label>
                <Input
                  id="nik"
                  value={form.nik}
                  onChange={handleChange("nik")}
                  placeholder="16 digit"
                  maxLength={16}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="nip">NIP</Label>
                <Input
                  id="nip"
                  value={form.nip}
                  onChange={handleChange("nip")}
                  placeholder="18 digit"
                  maxLength={18}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange("email")}
                  placeholder="email@rsud.go.id"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tempat_lahir">Tempat Lahir</Label>
                <Input
                  id="tempat_lahir"
                  value={form.tempat_lahir}
                  onChange={handleChange("tempat_lahir")}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tanggal_lahir">Tanggal Lahir</Label>
                <Input
                  id="tanggal_lahir"
                  type="date"
                  value={form.tanggal_lahir}
                  onChange={handleChange("tanggal_lahir")}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="jenis_kelamin">Jenis Kelamin</Label>
                <select
                  id="jenis_kelamin"
                  value={form.jenis_kelamin}
                  onChange={handleChange("jenis_kelamin")}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                >
                  <option value="">Pilih</option>
                  <option value="Laki-laki">Laki-laki</option>
                  <option value="Perempuan">Perempuan</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="telepon">Telepon</Label>
                <Input
                  id="telepon"
                  value={form.telepon}
                  onChange={handleChange("telepon")}
                  placeholder="08xxxxxxxxxx"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="alamat">Alamat</Label>
              <Input
                id="alamat"
                value={form.alamat}
                onChange={handleChange("alamat")}
                placeholder="Alamat lengkap"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <Button type="submit" disabled={createPegawai.isPending}>
                {createPegawai.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Simpan
              </Button>
              <Button variant="outline" type="button" onClick={() => router.push("/pegawai")}>
                Batal
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
