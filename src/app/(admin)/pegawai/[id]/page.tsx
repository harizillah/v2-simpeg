"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { usePegawaiDetail, useUpdatePegawai, useSoftDeletePegawai } from "@/hooks/use-pegawai";
import { useMasterData } from "@/hooks/use-master-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
        <TabsList className="flex-wrap">
          <TabsTrigger value="identitas">Identitas</TabsTrigger>
          <TabsTrigger value="kepegawaian">Kepegawaian</TabsTrigger>
          <TabsTrigger value="pendidikan">Pendidikan</TabsTrigger>
          <TabsTrigger value="sertifikat">Sertifikat</TabsTrigger>
          <TabsTrigger value="jabatan">Jabatan RS</TabsTrigger>
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

        {/* Tab: Pendidikan */}
        <TabsContent value="pendidikan">
          <PendidikanTab pegawaiId={id} data={(data as Record<string, unknown>).riwayat_pendidikan as unknown[]} />
        </TabsContent>

        {/* Tab: Sertifikat */}
        <TabsContent value="sertifikat">
          <SertifikatTab pegawaiId={id} data={(data as Record<string, unknown>).pegawai_sertifikat as unknown[]} />
        </TabsContent>

        {/* Tab: Jabatan RS */}
        <TabsContent value="jabatan">
          <JabatanRSTab pegawaiId={id} data={(data as Record<string, unknown>).pegawai_jabatan_rs as unknown[]} />
        </TabsContent>

        {/* Tab: KGB & Pangkat */}
        <TabsContent value="kgb">
          <KgbPangkatTab pegawaiId={id} data={(data as Record<string, unknown>).riwayat_kenaikan as unknown[]} />
        </TabsContent>

        {/* Other tabs: placeholder */}
        {["dokumen", "audit"].map((tab) => (
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

function PendidikanTab({ pegawaiId, data }: { pegawaiId: string; data: unknown[] | undefined }) {
  const [showAdd, setShowAdd] = useState(false);
  const { data: tingkatPendidikan } = useMasterData("master_tingkat_pendidikan");
  const [form, setForm] = useState({ tingkat_pendidikan_id: "", nama_universitas: "", nama_jurusan: "", tahun_lulus: "", nomor_ijazah: "" });

  const handleAdd = async () => {
    await fetch(`/api/pegawai/${pegawaiId}/riwayat-pendidikan`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tingkatPendidikanId: form.tingkat_pendidikan_id ? Number(form.tingkat_pendidikan_id) : undefined,
        namaUniversitas: form.nama_universitas || undefined,
        namaJurusan: form.nama_jurusan || undefined,
        tahunLulus: form.tahun_lulus ? Number(form.tahun_lulus) : undefined,
        nomorIjazah: form.nomor_ijazah || undefined,
      }),
    });
    window.location.reload();
  };

  const handleDelete = async (riwayatId: string) => {
    await fetch(`/api/pegawai/${pegawaiId}/riwayat-pendidikan/${riwayatId}`, { method: "DELETE" });
    window.location.reload();
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Riwayat Pendidikan</CardTitle>
        <Button size="sm" onClick={() => setShowAdd(true)}>Tambah</Button>
      </CardHeader>
      <CardContent>
        {!data || data.length === 0 ? (
          <p className="py-8 text-center text-muted-foreground">Belum ada riwayat pendidikan</p>
        ) : (
          <div className="space-y-3">
            {data.map((item) => {
              const i = item as Record<string, unknown>;
              return (
                <div key={String(i.id)} className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <p className="font-medium">{String((i.tingkat as { nama?: string } | null)?.nama || i.tingkat_text || "Tidak diketahui")}</p>
                    <p className="text-sm text-muted-foreground">{String(i.nama_universitas || "-")} — {String(i.nama_jurusan || "-")}</p>
                    <p className="text-xs text-muted-foreground">Lulus: {String(i.tahun_lulus || "-")} · Ijazah: {String(i.nomor_ijazah || "-")}</p>
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => handleDelete(String(i.id))}>Hapus</Button>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>

      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent>
          <DialogHeader><DialogTitle>Tambah Riwayat Pendidikan</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Tingkat Pendidikan</Label>
              <Select value={form.tingkat_pendidikan_id} onValueChange={(v) => setForm((f) => ({ ...f, tingkat_pendidikan_id: v ?? "" }))}>
                <SelectTrigger><SelectValue placeholder="Pilih" /></SelectTrigger>
                <SelectContent>
                  {(tingkatPendidikan as { id: number; nama: string }[] | undefined)?.map((t) => (
                    <SelectItem key={t.id} value={String(t.id)}>{t.nama}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Universitas</Label>
              <Input value={form.nama_universitas} onChange={(e) => setForm((f) => ({ ...f, nama_universitas: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label>Jurusan</Label>
              <Input value={form.nama_jurusan} onChange={(e) => setForm((f) => ({ ...f, nama_jurusan: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Tahun Lulus</Label>
                <Input type="number" value={form.tahun_lulus} onChange={(e) => setForm((f) => ({ ...f, tahun_lulus: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label>Nomor Ijazah</Label>
                <Input value={form.nomor_ijazah} onChange={(e) => setForm((f) => ({ ...f, nomor_ijazah: e.target.value }))} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdd(false)}>Batal</Button>
            <Button onClick={handleAdd}>Simpan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

function SertifikatTab({ pegawaiId, data }: { pegawaiId: string; data: unknown[] | undefined }) {
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ jenis_sertifikat: "", nama_kegiat_an: "", tmt_kegiat_an: "", penyedia: "", lokasi: "", berlaku_hingga: "", jumlah_jam: "" });

  const handleAdd = async () => {
    await fetch(`/api/pegawai/${pegawaiId}/sertifikat`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ jenisSertifikat: form.jenis_sertifikat, namaKegiatan: form.nama_kegiat_an, tmtKegiatan: form.tmt_kegiat_an || undefined, penyedia: form.penyedia || undefined, lokasi: form.lokasi || undefined, berlakuHingga: form.berlaku_hingga || undefined, jumlahJam: form.jumlah_jam ? Number(form.jumlah_jam) : undefined }) });
    window.location.reload();
  };
  const handleDelete = async (sertifikatId: string) => { await fetch(`/api/pegawai/${pegawaiId}/sertifikat/${sertifikatId}`, { method: "DELETE" }); window.location.reload(); };
  const jenisOpts = ["STR", "SIP", "Sertifikat", "Diklat"];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between"><CardTitle>Sertifikat / STR / SIP</CardTitle><Button size="sm" onClick={() => setShowAdd(true)}>Tambah</Button></CardHeader>
      <CardContent>
        {!data || data.length === 0 ? (<p className="py-8 text-center text-muted-foreground">Belum ada sertifikat</p>) : (
          <div className="space-y-3">
            {data.map((item) => {
              const i = item as Record<string, unknown>;
              const berlakuStr = String(i.berlaku_hingga || "");
              const isExpired = berlakuStr && new Date(berlakuStr) < new Date();
              return (
                <div key={String(i.id)} className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant={String(i.jenis_sertifikat) === "STR" ? "default" : String(i.jenis_sertifikat) === "SIP" ? "secondary" : "outline"}>{String(i.jenis_sertifikat || "Sertifikat")}</Badge>
                      {berlakuStr && (<Badge variant={isExpired ? "destructive" : "secondary"} className="text-xs">{isExpired ? "Kedaluwarsa" : `Berlaku: ${formatDate(berlakuStr)}`}</Badge>)}
                    </div>
                    <p className="mt-1 font-medium">{String(i.nama_kegiat_an || "-")}</p>
                    <p className="text-sm text-muted-foreground">{i.tmt_kegiat_an ? formatDate(String(i.tmt_kegiat_an)) : ""}{i.penyedia ? ` · ${String(i.penyedia)}` : ""}{i.jumlah_jam ? ` · ${String(i.jumlah_jam)} jam` : ""}</p>
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => handleDelete(String(i.id))}>Hapus</Button>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent>
          <DialogHeader><DialogTitle>Tambah Sertifikat / STR / SIP</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1"><Label>Jenis</Label>
              <Select value={form.jenis_sertifikat} onValueChange={(v) => setForm((f) => ({ ...f, jenis_sertifikat: v ?? "" }))}>
                <SelectTrigger><SelectValue placeholder="Pilih" /></SelectTrigger>
                <SelectContent>{jenisOpts.map((j) => (<SelectItem key={j} value={j}>{j}</SelectItem>))}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1"><Label>Nama Kegiatan *</Label><Input value={form.nama_kegiat_an} onChange={(e) => setForm((f) => ({ ...f, nama_kegiat_an: e.target.value }))} required /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><Label>TMT Kegiatan</Label><Input type="date" value={form.tmt_kegiat_an} onChange={(e) => setForm((f) => ({ ...f, tmt_kegiat_an: e.target.value }))} /></div>
              <div className="space-y-1"><Label>Jumlah Jam</Label><Input type="number" value={form.jumlah_jam} onChange={(e) => setForm((f) => ({ ...f, jumlah_jam: e.target.value }))} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><Label>Penyedia</Label><Input value={form.penyedia} onChange={(e) => setForm((f) => ({ ...f, penyedia: e.target.value }))} /></div>
              <div className="space-y-1"><Label>Lokasi</Label><Input value={form.lokasi} onChange={(e) => setForm((f) => ({ ...f, lokasi: e.target.value }))} /></div>
            </div>
            <div className="space-y-1"><Label>Berlaku Hingga</Label><Input type="date" value={form.berlaku_hingga} onChange={(e) => setForm((f) => ({ ...f, berlaku_hingga: e.target.value }))} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setShowAdd(false)}>Batal</Button><Button onClick={handleAdd}>Simpan</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

function KgbPangkatTab({ pegawaiId, data }: { pegawaiId: string; data: unknown[] | undefined }) {
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ jenis_kenaikan: "kgb", golongan_lama_id: "", golongan_baru_id: "", tmt_seharusnya: "", tmt_kenaikan: "", is_retroaktif: false, keterangan: "" });
  const { data: golongan } = useMasterData("golongan");

  const handleAdd = async () => {
    await fetch("/api/riwayat-kenaikan", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ pegawaiId, jenis_kenaikan: form.jenis_kenaikan, golonganLamaId: form.golongan_lama_id ? Number(form.golongan_lama_id) : undefined, golonganBaruId: form.golongan_baru_id ? Number(form.golongan_baru_id) : undefined, tmtSeharusnya: form.tmt_seharusnya, tmtKenaikan: form.tmt_kenaikan || undefined, isRetroaktif: form.is_retroaktif, keterangan: form.keterangan || undefined }) });
    window.location.reload();
  };

  const kgbItems = (data || []).filter((i) => (i as Record<string, unknown>).jenis_kenaikan === "kgb");
  const pangkatItems = (data || []).filter((i) => (i as Record<string, unknown>).jenis_kenaikan === "pangkat");

  return (
    <div className="space-y-6">
      <Card><CardHeader className="flex flex-row items-center justify-between"><CardTitle>Riwayat KGB</CardTitle><Button size="sm" onClick={() => { setForm(f => ({ ...f, jenis_kenaikan: "kgb" })); setShowAdd(true); }}>Tambah KGB</Button></CardHeader>
        <CardContent>{kgbItems.length === 0 ? <p className="py-8 text-center text-muted-foreground">Belum ada riwayat KGB</p> : (
          <div className="space-y-3">{kgbItems.map((item) => { const i = item as Record<string, unknown>; return (
            <div key={String(i.id)} className="rounded-lg border p-3">
              <div className="flex flex-wrap items-center gap-2">
                {(i.golongan_lama as { pangkat?: string } | null)?.pangkat && (i.golongan_baru as { pangkat?: string } | null)?.pangkat && <Badge variant="secondary">{(i.golongan_lama as { pangkat: string }).pangkat} → {(i.golongan_baru as { pangkat: string }).pangkat}</Badge>}
                {Boolean(i.is_retroaktif) && <Badge variant="outline">Retroaktif</Badge>}
              </div>
              <p className="mt-1 text-sm">TMT Seharusnya: {formatDate(String(i.tmt_seharusnya))}{i.tmt_kenaikan ? ` · TMT Kenaikan: ${formatDate(String(i.tmt_kenaikan))}` : " · Belum diproses"}</p>
              {Boolean(i.keterangan) && <p className="text-xs text-muted-foreground">{String(i.keterangan)}</p>}
            </div>
          );})}</div>
        )}</CardContent>
      </Card>
      <Card><CardHeader className="flex flex-row items-center justify-between"><CardTitle>Riwayat Kenaikan Pangkat</CardTitle><Button size="sm" onClick={() => { setForm(f => ({ ...f, jenis_kenaikan: "pangkat" })); setShowAdd(true); }}>Tambah Pangkat</Button></CardHeader>
        <CardContent>{pangkatItems.length === 0 ? <p className="py-8 text-center text-muted-foreground">Belum ada riwayat kenaikan pangkat</p> : (
          <div className="space-y-3">{pangkatItems.map((item) => { const i = item as Record<string, unknown>; return (
            <div key={String(i.id)} className="rounded-lg border p-3">
              <div className="flex flex-wrap items-center gap-2">
                {(i.golongan_lama as { pangkat?: string } | null)?.pangkat && (i.golongan_baru as { pangkat?: string } | null)?.pangkat && <Badge variant="secondary">{(i.golongan_lama as { pangkat: string }).pangkat} → {(i.golongan_baru as { pangkat: string }).pangkat}</Badge>}
                {Boolean(i.is_override) && <Badge variant="outline">Override</Badge>}
              </div>
              <p className="mt-1 text-sm">TMT Seharusnya: {formatDate(String(i.tmt_seharusnya))}{i.tmt_kenaikan ? ` · TMT Kenaikan: ${formatDate(String(i.tmt_kenaikan))}` : " · Belum diproses"}</p>
              {Boolean(i.alasan_override) && <p className="text-xs text-muted-foreground">Alasan: {String(i.alasan_override)}</p>}
            </div>
          );})}</div>
        )}</CardContent>
      </Card>
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent><DialogHeader><DialogTitle>Tambah Riwayat Kenaikan</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1"><Label>Jenis</Label>
              <Select value={form.jenis_kenaikan} onValueChange={(v) => setForm((f) => ({ ...f, jenis_kenaikan: v ?? "kgb" }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="kgb">KGB</SelectItem><SelectItem value="pangkat">Pangkat</SelectItem></SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><Label>Golongan Lama</Label>
                <Select value={form.golongan_lama_id} onValueChange={(v) => setForm((f) => ({ ...f, golongan_lama_id: v ?? "" }))}>
                  <SelectTrigger><SelectValue placeholder="Pilih" /></SelectTrigger>
                  <SelectContent>{(golongan as { id: number; nama: string }[] | undefined)?.map((g) => (<SelectItem key={g.id} value={String(g.id)}>{g.nama}</SelectItem>))}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1"><Label>Golongan Baru</Label>
                <Select value={form.golongan_baru_id} onValueChange={(v) => setForm((f) => ({ ...f, golongan_baru_id: v ?? "" }))}>
                  <SelectTrigger><SelectValue placeholder="Pilih" /></SelectTrigger>
                  <SelectContent>{(golongan as { id: number; nama: string }[] | undefined)?.map((g) => (<SelectItem key={g.id} value={String(g.id)}>{g.nama}</SelectItem>))}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><Label>TMT Seharusnya</Label><Input type="date" value={form.tmt_seharusnya} onChange={(e) => setForm((f) => ({ ...f, tmt_seharusnya: e.target.value }))} /></div>
              <div className="space-y-1"><Label>TMT Kenaikan</Label><Input type="date" value={form.tmt_kenaikan} onChange={(e) => setForm((f) => ({ ...f, tmt_kenaikan: e.target.value }))} /></div>
            </div>
            <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={form.is_retroaktif} onChange={(e) => setForm((f) => ({ ...f, is_retroaktif: e.target.checked }))} className="h-4 w-4 rounded border-input" /><span className="text-sm">Retroaktif</span></label>
            <div className="space-y-1"><Label>Keterangan</Label><Input value={form.keterangan} onChange={(e) => setForm((f) => ({ ...f, keterangan: e.target.value }))} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setShowAdd(false)}>Batal</Button><Button onClick={handleAdd}>Simpan</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function JabatanRSTab({ pegawaiId, data }: { pegawaiId: string; data: unknown[] | undefined }) {
  const [showAdd, setShowAdd] = useState(false);
  const { data: jabatanRS } = useMasterData("jabatan_rs");
  const [form, setForm] = useState({ jabatan_rs_id: "", tmt_jabatan: "", keterangan: "" });

  const handleAdd = async () => {
    await fetch(`/api/pegawai/${pegawaiId}/jabatan-rs`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jabatanRsId: Number(form.jabatan_rs_id), tmtJabatan: form.tmt_jabatan || undefined, keterangan: form.keterangan || undefined }),
    });
    window.location.reload();
  };

  const handleDelete = async (jabatanId: number) => {
    await fetch(`/api/pegawai/${pegawaiId}/jabatan-rs?jabatanId=${jabatanId}`, { method: "DELETE" });
    window.location.reload();
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Riwayat Jabatan RS</CardTitle>
        <Button size="sm" onClick={() => setShowAdd(true)}>Tambah</Button>
      </CardHeader>
      <CardContent>
        {!data || data.length === 0 ? (
          <p className="py-8 text-center text-muted-foreground">Belum ada riwayat jabatan</p>
        ) : (
          <div className="space-y-3">
            {data.map((item) => {
              const i = item as Record<string, unknown>;
              return (
                <div key={String(i.id)} className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <p className="font-medium">{String((i.jabatan_rs as { nama?: string } | null)?.nama || "Tidak diketahui")}</p>
                    <p className="text-sm text-muted-foreground">TMT: {formatDate(i.tmt_jabatan as string)}</p>
                    {(i.keterangan as string) && <p className="text-xs text-muted-foreground">{String(i.keterangan)}</p>}
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => handleDelete(i.id as number)}>Hapus</Button>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>

      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent>
          <DialogHeader><DialogTitle>Tambah Jabatan RS</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Jabatan RS</Label>
              <Select value={form.jabatan_rs_id} onValueChange={(v) => setForm((f) => ({ ...f, jabatan_rs_id: v ?? "" }))}>
                <SelectTrigger><SelectValue placeholder="Pilih" /></SelectTrigger>
                <SelectContent>
                  {(jabatanRS as { id: number; nama: string }[] | undefined)?.map((j) => (
                    <SelectItem key={j.id} value={String(j.id)}>{j.nama}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>TMT Jabatan</Label>
              <Input type="date" value={form.tmt_jabatan} onChange={(e) => setForm((f) => ({ ...f, tmt_jabatan: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label>Keterangan</Label>
              <Input value={form.keterangan} onChange={(e) => setForm((f) => ({ ...f, keterangan: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdd(false)}>Batal</Button>
            <Button onClick={handleAdd}>Simpan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
