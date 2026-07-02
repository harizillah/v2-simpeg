"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ArrowLeft, Check, X } from "lucide-react";
import { formatDateTime } from "@/lib/helpers/format";
import { toast } from "sonner";

const STATUS: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pending: { label: "Pending", variant: "default" },
  diterima: { label: "Diterima", variant: "secondary" },
  ditolak: { label: "Ditolak", variant: "destructive" },
};

export default function VerifikasiDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [rejectOpen, setRejectOpen] = useState(false);
  const [catatan, setCatatan] = useState("");
  const [loading, setLoading] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["verifikasi", id],
    queryFn: async () => {
      const res = await fetch(`/api/pengajuan-verifikasi/${id}`);
      if (!res.ok) throw new Error("Gagal");
      return res.json();
    },
  });

  const handleApprove = async () => {
    setLoading(true);
    const res = await fetch(`/api/pengajuan-verifikasi/${id}/approve`, { method: "POST" });
    if (!res.ok) { toast.error("Gagal", { description: "Gagal menyetujui pengajuan" }); setLoading(false); return; }
    toast.success("Berhasil", { description: "Pengajuan disetujui dan data diperbarui" });
    router.push("/verifikasi");
  };

  const handleReject = async () => {
    setLoading(true);
    const res = await fetch(`/api/pengajuan-verifikasi/${id}/reject`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ catatan }) });
    if (!res.ok) { toast.error("Gagal", { description: "Gagal menolak pengajuan" }); setLoading(false); return; }
    toast.success("Berhasil", { description: "Pengajuan ditolak" });
    setRejectOpen(false);
    router.push("/verifikasi");
  };

  if (isLoading) return <div className="space-y-4"><Skeleton className="h-8 w-48" /><Skeleton className="h-[300px] w-full" /></div>;
  const pengajuan = data?.data as Record<string, unknown> | undefined;

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push("/verifikasi")}><ArrowLeft className="h-4 w-4" /></Button>
        <h1 className="text-2xl font-bold">Detail Pengajuan</h1>
        {pengajuan && <Badge variant={STATUS[String(pengajuan.status)]?.variant || "outline"}>{STATUS[String(pengajuan.status)]?.label || String(pengajuan.status)}</Badge>}
      </div>

      {pengajuan && (
        <>
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader><CardTitle className="text-base">Data Lama</CardTitle></CardHeader>
              <CardContent>
                <pre className="text-sm whitespace-pre-wrap">{JSON.stringify(pengajuan.data_lama, null, 2)}</pre>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-base">Data Baru</CardTitle></CardHeader>
              <CardContent>
                <pre className="text-sm whitespace-pre-wrap bg-muted/30 rounded p-3">{JSON.stringify(pengajuan.data_baru, null, 2)}</pre>
              </CardContent>
            </Card>
          </div>
          {pengajuan.status === "pending" && (
            <div className="flex gap-2">
              <Button onClick={handleApprove} disabled={loading}><Check className="mr-2 h-4 w-4" />Setujui</Button>
              <Button variant="outline" onClick={() => setRejectOpen(true)} disabled={loading}><X className="mr-2 h-4 w-4" />Tolak</Button>
            </div>
          )}
          {pengajuan.catatan && <p className="text-sm text-muted-foreground">Catatan: {String(pengajuan.catatan)}</p>}
          <p className="text-xs text-muted-foreground">Diajukan: {formatDateTime(String(pengajuan.created_at))}</p>
        </>
      )}

      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Alasan Penolakan</DialogTitle></DialogHeader>
          <textarea value={catatan} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setCatatan(e.target.value)} placeholder="Masukkan alasan penolakan..." rows={4} className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background" />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectOpen(false)}>Batal</Button>
            <Button variant="destructive" onClick={handleReject} disabled={loading || !catatan.trim()}>Tolak</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
