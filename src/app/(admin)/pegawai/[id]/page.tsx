"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { usePegawaiDetail, useUpdatePegawai, useSoftDeletePegawai } from "@/hooks/use-pegawai";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ArrowLeft, Loader2, Trash2, Save } from "lucide-react";
import { formatDate } from "@/lib/helpers/format";

export default function PegawaiDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { data, isLoading, error } = usePegawaiDetail(id);
  const updatePegawai = useUpdatePegawai();
  const softDelete = useSoftDeletePegawai();
  const [isEditing, setIsEditing] = useState(false);
  const [showDelete, setShowDelete] = useState(false);

  const [form, setForm] = useState<Record<string, string>>({});

  const startEdit = () => {
    if (!data) return;
    setForm({
      nama_lengkap: data.nama_lengkap || "",
      nik: data.nik || "",
      nip: data.nip || "",
      email: data.email || "",
      tempat_lahir: data.tempat_lahir || "",
      tanggal_lahir: data.tanggal_lahir || "",
      jenis_kelamin: data.jenis_kelamin || "",
      telepon: data.telepon || "",
      alamat: data.alamat || "",
    });
    setIsEditing(true);
  };

  const handleSave = async () => {
    await updatePegawai.mutateAsync({ id, data: form });
    setIsEditing(false);
  };

  const handleDelete = async () => {
    await softDelete.mutateAsync(id);
    setShowDelete(false);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">Pegawai tidak ditemukan.</p>
          <Button className="mt-4" onClick={() => router.push("/pegawai")}>Kembali</Button>
        </CardContent>
      </Card>
    );
  }

  const pegawai = data as Record<string, unknown>;

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push("/pegawai")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{pegawai.nama_lengkap as string}</h1>
            <p className="text-muted-foreground">
              NIP: {pegawai.nip as string || "-"} • NIK: {pegawai.nik as string || "-"}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {!isEditing ? (
            <>
              <Button onClick={startEdit}>
                <Save className="mr-2 h-4 w-4" />
                Edit
              </Button>
              <Button variant="destructive" onClick={() => setShowDelete(true)}>
                <Trash2 className="mr-2 h-4 w-4" />
                Nonaktifkan
              </Button>
            </>
          ) : (
            <>
              <Button onClick={handleSave} disabled={updatePegawai.isPending}>
                {updatePegawai.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Simpan
              </Button>
              <Button variant="outline" onClick={() => setIsEditing(false)}>
                Batal
              </Button>
            </>
          )}
        </div>
      </div>

      <Tabs defaultValue="identitas">
        <TabsList>
          <TabsTrigger value="identitas">Identitas</TabsTrigger>
          <TabsTrigger value="kepegawaian">Kepegawaian</TabsTrigger>
          <TabsTrigger value="pendidikan">Pendidikan</TabsTrigger>
          <TabsTrigger value="sertifikat">Sertifikat</TabsTrigger>
          <TabsTrigger value="kgb">KGB & Pangkat</TabsTrigger>
          <TabsTrigger value="dokumen">Dokumen</TabsTrigger>
          <TabsTrigger value="audit">Audit</TabsTrigger>
        </TabsList>

        {/* Tab: Identitas */}
        <TabsContent value="identitas">
          <Card>
            <CardHeader><CardTitle>Identitas</CardTitle></CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              {isEditing ? (
                <>
                  <div className="space-y-2">
                    <Label>Nama Lengkap</Label>
                    <Input value={form.nama_lengkap} onChange={(e) => setForm({ ...form, nama_lengkap: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>NIK</Label>
                    <Input value={form.nik} onChange={(e) => setForm({ ...form, nik: e.target.value })} maxLength={16} />
                  </div>
                  <div className="space-y-2">
                    <Label>NIP</Label>
                    <Input value={form.nip} onChange={(e) => setForm({ ...form, nip: e.target.value })} maxLength={18} />
                  </div>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Tempat Lahir</Label>
                    <Input value={form.tempat_lahir} onChange={(e) => setForm({ ...form, tempat_lahir: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Tanggal Lahir</Label>
                    <Input type="date" value={form.tanggal_lahir} onChange={(e) => setForm({ ...form, tanggal_lahir: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Jenis Kelamin</Label>
                    <select
                      value={form.jenis_kelamin}
                      onChange={(e) => setForm({ ...form, jenis_kelamin: e.target.value })}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      <option value="">Pilih</option>
                      <option value="Laki-laki">Laki-laki</option>
                      <option value="Perempuan">Perempuan</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>Telepon</Label>
                    <Input value={form.telepon} onChange={(e) => setForm({ ...form, telepon: e.target.value })} />
                  </div>
                </>
              ) : (
                <>
                  <InfoItem label="Nama Lengkap" value={pegawai.nama_lengkap as string} />
                  <InfoItem label="NIK" value={pegawai.nik as string} />
                  <InfoItem label="NIP" value={pegawai.nip as string} />
                  <InfoItem label="Email" value={pegawai.email as string} />
                  <InfoItem label="Tempat Lahir" value={pegawai.tempat_lahir as string} />
                  <InfoItem label="Tanggal Lahir" value={formatDate(pegawai.tanggal_lahir as string)} />
                  <InfoItem label="Jenis Kelamin" value={pegawai.jenis_kelamin as string} />
                  <InfoItem label="Telepon" value={pegawai.telepon as string} />
                  <InfoItem label="Alamat" value={pegawai.alamat as string} className="md:col-span-2" />
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Kepegawaian */}
        <TabsContent value="kepegawaian">
          <Card>
            <CardHeader><CardTitle>Kepegawaian</CardTitle></CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <InfoItem label="Status Kepegawaian" value={(pegawai.status_pegawai as { nama?: string })?.nama} />
              <InfoItem label="Unit Kerja" value={(pegawai.struktur as { nama?: string })?.nama} />
              <InfoItem label="Jabatan Fungsional" value={(pegawai.jabatan_fungsional as { nama?: string })?.nama} />
              <InfoItem label="Jenis Tenaga" value={(pegawai.jenis_tenaga as { nama?: string })?.nama} />
              <InfoItem label="Golongan" value={`${(pegawai.golongan as { pangkat?: string })?.pangkat || ""} (${(pegawai.golongan as { nama?: string })?.nama || ""})`} />
              <InfoItem label="Eselon" value={pegawai.eselon as string} />
              <InfoItem label="TMT Pangkat" value={formatDate(pegawai.tmt_pangkat as string)} />
              <InfoItem label="TMT CPNS" value={formatDate(pegawai.tmt_cpns as string)} />
              <InfoItem label="TMT Jabatan" value={formatDate(pegawai.tmt_jabatan as string)} />
              <InfoItem label="Tenaga Medis" value={pegawai.is_tenaga_medis ? "Ya" : "Tidak"} />
              <InfoItem label="Wajib STR" value={pegawai.wajib_str ? "Ya" : "Tidak"} />
              <InfoItem label="Wajib SIP" value={pegawai.wajib_sip ? "Ya" : "Tidak"} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Other tabs: placeholder */}
        {["pendidikan", "sertifikat", "kgb", "dokumen", "audit"].map((tab) => (
          <TabsContent key={tab} value={tab}>
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                Data {tab} akan tersedia di tahap berikutnya.
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      {/* Delete Confirmation */}
      <Dialog open={showDelete} onOpenChange={setShowDelete}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nonaktifkan Pegawai</DialogTitle>
            <DialogDescription>
              Pegawai akan dipindahkan ke arsip. Data dapat dipulihkan kembali.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDelete(false)}>Batal</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={softDelete.isPending}>
              {softDelete.isPending ? "Menonaktifkan..." : "Nonaktifkan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function InfoItem({ label, value, className }: { label: string; value?: string | null; className?: string }) {
  return (
    <div className={className}>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="font-medium">{value || "-"}</p>
    </div>
  );
}
