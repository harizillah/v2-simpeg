"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

export default function TemplateLaporanPage() {
  const router = useRouter();
  const qc = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ nama: "", jenis_laporan: "custom" });

  const { data, isLoading } = useQuery({
    queryKey: ["template-laporan"],
    queryFn: async () => { const res = await fetch("/api/laporan/template"); if (!res.ok) throw new Error("Gagal"); return res.json(); },
  });

  const handleAdd = async () => {
    const res = await fetch("/api/laporan/template", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    if (!res.ok) { toast.error("Gagal", { description: (await res.json()).error }); return; }
    toast.success("Berhasil", { description: "Template berhasil disimpan" });
    setShowAdd(false); setForm({ nama: "", jenis_laporan: "custom" }); qc.invalidateQueries({ queryKey: ["template-laporan"] });
  };

  const handleDelete = async (id: string) => {
    const res = await fetch(`/api/laporan/template/${id}`, { method: "DELETE" });
    if (!res.ok) { toast.error("Gagal"); return; }
    toast.success("Berhasil", { description: "Template dinonaktifkan" });
    qc.invalidateQueries({ queryKey: ["template-laporan"] });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push("/laporan")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold">Template Laporan</h1>
        </div>
        <Button onClick={() => setShowAdd(true)}>
          <Plus className="mr-2 h-4 w-4" /> Buat Template
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4 space-y-2">{Array.from({ length: 5 }).map((_, i) => (<Skeleton key={i} className="h-12 w-full" />))}</div>
          ) : !data?.data?.length ? (
            <p className="py-12 text-center text-muted-foreground">Belum ada template laporan</p>
          ) : (
            <table className="w-full">
              <thead><tr className="border-b text-left text-sm">{["Nama", "Jenis", "Type", "Aksi"].map(h => <th key={h} className="p-3 font-medium text-muted-foreground">{h}</th>)}</tr></thead>
              <tbody>
                {data.data.map((t: Record<string, unknown>) => (
                  <tr key={String(t.id)} className="border-b text-sm hover:bg-muted/50">
                    <td className="p-3 font-medium">{String(t.nama)}</td>
                    <td className="p-3"><Badge variant="outline">{String(t.jenis_laporan)}</Badge></td>
                    <td className="p-3"><Badge variant={t.is_default ? "secondary" : "default"}>{t.is_default ? "Bawaan" : "Custom"}</Badge></td>
                    <td className="p-3">
                      {!t.is_default && (
                        <Button size="sm" variant="ghost" onClick={() => handleDelete(String(t.id))}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent>
          <DialogHeader><DialogTitle>Buat Template Laporan</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1"><Label>Nama Template</Label><Input value={form.nama} onChange={e => setForm({...form, nama: e.target.value})} placeholder="Nama template" /></div>
            <div className="space-y-1"><Label>Jenis Laporan</Label>
              <Select value={form.jenis_laporan} onValueChange={v => setForm({...form, jenis_laporan: v??"custom"})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["duk","jenis_tenaga","pensiun","pangkat","kgb","kontrak","bezzeting","komposisi","custom"].map(j => (
                    <SelectItem key={j} value={j}>{j.replace(/_/g, " ")}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdd(false)}>Batal</Button>
            <Button onClick={handleAdd} disabled={!form.nama}>Simpan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
