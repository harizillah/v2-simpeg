"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCreatePegawai } from "@/hooks/use-pegawai";
import { useMasterData } from "@/hooks/use-master-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Loader2 } from "lucide-react";

export default function TambahPegawaiPage() {
  const router = useRouter();
  const createPegawai = useCreatePegawai();
  const { data: golongan } = useMasterData("golongan");
  const { data: statusPegawai } = useMasterData("status_pegawai");
  const { data: jabatanFungsional } = useMasterData("jabatan_fungsional");
  const { data: jenisTenaga } = useMasterData("master_jenis_tenaga");
  const { data: strukturOrg } = useMasterData("struktur_organisasi");

  const [form, setForm] = useState<Record<string, string | boolean>>({
    nama_lengkap: "", nik: "", nip: "", email: "", tempat_lahir: "",
    tanggal_lahir: "", jenis_kelamin: "", agama: "", status_pernikahan: "",
    telepon: "", alamat: "",
    status_kepegawaian_id: "", struktur_organisasi_id: "",
    jabatan_fungsional_id: "", jenis_tenaga_id: "", eselon: "",
    golongan_id: "", golongan_cpns_id: "",
    tmt_pangkat: "", tmt_jabatan: "", tmt_cpns: "",
    tmt_awal: "", tmt_akhir: "",
    tmt_kgb: "", tmt_kgb_seharusnya: "",
    is_tenaga_medis: false, wajib_str: false, wajib_sip: false,
  });

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((prev) => ({ ...prev, [k]: e.target.value }));
  const setBool = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [k]: e.target.checked }));
  const setSelect = (k: string) => (v: string | null) =>
    setForm((prev) => ({ ...prev, [k]: v ?? "" }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!(form.nama_lengkap as string).trim()) return;
    const result = await createPegawai.mutateAsync(form);
    if (result.data?.id) router.push(`/pegawai/${result.data.id}`);
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push("/pegawai")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold tracking-tight">Tambah Pegawai</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Identitas */}
        <Card>
          <CardHeader><CardTitle>Identitas</CardTitle></CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <Field label="Nama Lengkap *"><Input value={form.nama_lengkap as string} onChange={set("nama_lengkap")} required /></Field>
            <Field label="NIK"><Input value={form.nik as string} onChange={set("nik")} maxLength={16} /></Field>
            <Field label="NIP"><Input value={form.nip as string} onChange={set("nip")} maxLength={18} /></Field>
            <Field label="Email"><Input type="email" value={form.email as string} onChange={set("email")} /></Field>
            <Field label="Tempat Lahir"><Input value={form.tempat_lahir as string} onChange={set("tempat_lahir")} /></Field>
            <Field label="Tanggal Lahir"><Input type="date" value={form.tanggal_lahir as string} onChange={set("tanggal_lahir")} /></Field>
            <Field label="Jenis Kelamin">
              <Select value={form.jenis_kelamin as string} onValueChange={setSelect("jenis_kelamin")}>
                <SelectTrigger><SelectValue placeholder="Pilih" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Laki-laki">Laki-laki</SelectItem>
                  <SelectItem value="Perempuan">Perempuan</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="Agama">
              <Select value={form.agama as string} onValueChange={setSelect("agama")}>
                <SelectTrigger><SelectValue placeholder="Pilih" /></SelectTrigger>
                <SelectContent>
                  {["Islam", "Kristen", "Katolik", "Hindu", "Buddha", "Konghucu"].map((a) => (
                    <SelectItem key={a} value={a}>{a}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Status Pernikahan">
              <Select value={form.status_pernikahan as string} onValueChange={setSelect("status_pernikahan")}>
                <SelectTrigger><SelectValue placeholder="Pilih" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Belum Menikah">Belum Menikah</SelectItem>
                  <SelectItem value="Menikah">Menikah</SelectItem>
                  <SelectItem value="Duda">Duda</SelectItem>
                  <SelectItem value="Janda">Janda</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="Telepon"><Input value={form.telepon as string} onChange={set("telepon")} /></Field>
            <Field label="Alamat" className="md:col-span-2"><Input value={form.alamat as string} onChange={set("alamat")} /></Field>
          </CardContent>
        </Card>

        {/* Kepegawaian */}
        <Card>
          <CardHeader><CardTitle>Kepegawaian</CardTitle></CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <Field label="Status Kepegawaian">
              <Select value={form.status_kepegawaian_id as string} onValueChange={setSelect("status_kepegawaian_id")}>
                <SelectTrigger><SelectValue placeholder="Pilih" /></SelectTrigger>
                <SelectContent>
                  {(statusPegawai as { id: number; nama: string }[] | undefined)?.map((s) => (
                    <SelectItem key={s.id} value={String(s.id)}>{s.nama}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Unit Kerja">
              <Select value={form.struktur_organisasi_id as string} onValueChange={setSelect("struktur_organisasi_id")}>
                <SelectTrigger><SelectValue placeholder="Pilih" /></SelectTrigger>
                <SelectContent>
                  {(strukturOrg as { id: number; nama: string; is_active?: boolean }[] | undefined)?.filter((s) => s.is_active !== false).map((s) => (
                    <SelectItem key={s.id} value={String(s.id)}>{s.nama}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Jabatan Fungsional">
              <Select value={form.jabatan_fungsional_id as string} onValueChange={setSelect("jabatan_fungsional_id")}>
                <SelectTrigger><SelectValue placeholder="Pilih" /></SelectTrigger>
                <SelectContent>
                  {(jabatanFungsional as { id: number; nama: string }[] | undefined)?.map((j) => (
                    <SelectItem key={j.id} value={String(j.id)}>{j.nama}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Jenis Tenaga">
              <Select value={form.jenis_tenaga_id as string} onValueChange={setSelect("jenis_tenaga_id")}>
                <SelectTrigger><SelectValue placeholder="Pilih" /></SelectTrigger>
                <SelectContent>
                  {(jenisTenaga as { id: number; nama: string }[] | undefined)?.map((j) => (
                    <SelectItem key={j.id} value={String(j.id)}>{j.nama}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Eselon"><Input value={form.eselon as string} onChange={set("eselon")} /></Field>
          </CardContent>
        </Card>

        {/* Karier */}
        <Card>
          <CardHeader><CardTitle>Karier & Golongan</CardTitle></CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <Field label="Golongan">
              <Select value={form.golongan_id as string} onValueChange={setSelect("golongan_id")}>
                <SelectTrigger><SelectValue placeholder="Pilih" /></SelectTrigger>
                <SelectContent>
                  {(golongan as { id: number; nama: string; pangkat?: string | null }[] | undefined)?.map((g) => (
                    <SelectItem key={g.id} value={String(g.id)}>{g.nama} - {g.pangkat || ""}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="TMT Pangkat"><Input type="date" value={form.tmt_pangkat as string} onChange={set("tmt_pangkat")} /></Field>
            <Field label="TMT Jabatan"><Input type="date" value={form.tmt_jabatan as string} onChange={set("tmt_jabatan")} /></Field>
            <Field label="TMT CPNS"><Input type="date" value={form.tmt_cpns as string} onChange={set("tmt_cpns")} /></Field>
          </CardContent>
        </Card>

        {/* Kontrak */}
        <Card>
          <CardHeader><CardTitle>Kontrak</CardTitle></CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <Field label="TMT Awal"><Input type="date" value={form.tmt_awal as string} onChange={set("tmt_awal")} /></Field>
            <Field label="TMT Akhir"><Input type="date" value={form.tmt_akhir as string} onChange={set("tmt_akhir")} /></Field>
          </CardContent>
        </Card>

        {/* KGB */}
        <Card>
          <CardHeader><CardTitle>KGB</CardTitle></CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <Field label="TMT KGB"><Input type="date" value={form.tmt_kgb as string} onChange={set("tmt_kgb")} /></Field>
            <Field label="TMT KGB Seharusnya"><Input type="date" value={form.tmt_kgb_seharusnya as string} onChange={set("tmt_kgb_seharusnya")} /></Field>
          </CardContent>
        </Card>

        {/* STR/SIP */}
        <Card>
          <CardHeader><CardTitle>STR / SIP</CardTitle></CardHeader>
          <CardContent className="flex flex-wrap gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.is_tenaga_medis as boolean} onChange={setBool("is_tenaga_medis")} className="h-4 w-4 rounded border-input" />
              <span className="text-sm">Tenaga Medis</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.wajib_str as boolean} onChange={setBool("wajib_str")} className="h-4 w-4 rounded border-input" />
              <span className="text-sm">Wajib STR</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.wajib_sip as boolean} onChange={setBool("wajib_sip")} className="h-4 w-4 rounded border-input" />
              <span className="text-sm">Wajib SIP</span>
            </label>
          </CardContent>
        </Card>

        <div className="flex gap-2">
          <Button type="submit" disabled={createPegawai.isPending}>
            {createPegawai.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Simpan
          </Button>
          <Button variant="outline" type="button" onClick={() => router.push("/pegawai")}>Batal</Button>
        </div>
      </form>
    </div>
  );
}

function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`space-y-2 ${className ?? ""}`}>
      <Label>{label}</Label>
      {children}
    </div>
  );
}
