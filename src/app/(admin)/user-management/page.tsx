"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

const ROLES = [
  { id: 1, name: "super_admin" },
  { id: 2, name: "admin_kepegawaian" },
  { id: 3, name: "pegawai" },
];

export default function UserManagementPage() {
  const qc = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [resetId, setResetId] = useState<string | null>(null);
  const [form, setForm] = useState({ email: "", password: "", nama_lengkap: "", role_id: "3" });
  const [editForm, setEditForm] = useState({ nama_lengkap: "", role_id: "3", email: "" });
  const [resetPw, setResetPw] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["users"],
    queryFn: async () => { const res = await fetch("/api/users"); if (!res.ok) throw new Error("Gagal"); return res.json(); },
  });

  const handleAdd = async () => {
    const res = await fetch("/api/users", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, role_id: Number(form.role_id) }) });
    if (!res.ok) { toast.error("Gagal", { description: (await res.json()).error }); return; }
    toast.success("Berhasil", { description: "User berhasil dibuat" });
    setShowAdd(false); qc.invalidateQueries({ queryKey: ["users"] });
  };

  const handleEdit = async () => {
    const res = await fetch(`/api/users/${editId}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...editForm, role_id: Number(editForm.role_id) }) });
    if (!res.ok) { toast.error("Gagal", { description: (await res.json()).error }); return; }
    toast.success("Berhasil", { description: "User diperbarui" });
    setEditId(null); qc.invalidateQueries({ queryKey: ["users"] });
  };

  const handleResetPw = async () => {
    const res = await fetch(`/api/users/${resetId}/reset-password`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password: resetPw || undefined }) });
    if (!res.ok) { toast.error("Gagal", { description: (await res.json()).error }); return; }
    toast.success("Berhasil", { description: "Password direset" });
    setResetId(null); setResetPw("");
  };

  const openEdit = (user: Record<string, unknown>) => {
    setEditForm({ nama_lengkap: String(user.nama_lengkap || ""), role_id: String(user.role_id), email: String(user.email || "") });
    setEditId(String(user.id));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Manajemen User</h1>
        <Button onClick={() => setShowAdd(true)}>Tambah User</Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? <div className="p-4 space-y-2">{Array.from({ length: 5 }).map((_, i) => (<Skeleton key={i} className="h-12 w-full" />))}</div>
          : !data?.data?.length ? <p className="py-12 text-center text-muted-foreground">Tidak ada user</p>
          : (
            <table className="w-full">
              <thead><tr className="border-b text-left text-sm">{["Nama","Email","Role","Dibuat","Aksi"].map(h => <th key={h} className="p-3 font-medium text-muted-foreground">{h}</th>)}</tr></thead>
              <tbody>
                {data.data.map((u: Record<string, unknown>) => {
                  const role = (u.roles as { name?: string } | null)?.name || ROLES.find((r: { id: number }) => r.id === u.role_id)?.name || "-";
                  return (
                    <tr key={String(u.id)} className="border-b text-sm hover:bg-muted/50">
                      <td className="p-3 font-medium">{String(u.nama_lengkap || "-")}</td>
                      <td className="p-3 text-muted-foreground">{String(u.email)}</td>
                      <td className="p-3"><Badge variant="secondary">{String(role)}</Badge></td>
                      <td className="p-3 text-muted-foreground">{new Date(String(u.created_at)).toLocaleDateString("id-ID")}</td>
                      <td className="p-3 flex gap-1">
                        <Button size="sm" variant="outline" onClick={() => openEdit(u)}>Edit</Button>
                        <Button size="sm" variant="ghost" onClick={() => setResetId(String(u.id))}>Reset PW</Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      {/* Add User Dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent>
          <DialogHeader><DialogTitle>Tambah User</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1"><Label>Email</Label><Input value={form.email} onChange={e => setForm({...form, email: e.target.value})} /></div>
            <div className="space-y-1"><Label>Password</Label><Input value={form.password} onChange={e => setForm({...form, password: e.target.value})} placeholder="Min 8 karakter" /></div>
            <div className="space-y-1"><Label>Nama Lengkap</Label><Input value={form.nama_lengkap} onChange={e => setForm({...form, nama_lengkap: e.target.value})} /></div>
            <div className="space-y-1"><Label>Role</Label>
              <Select value={form.role_id} onValueChange={v => setForm({...form, role_id: v??"3"})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{ROLES.map(r => (<SelectItem key={r.id} value={String(r.id)}>{r.name}</SelectItem>))}</SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setShowAdd(false)}>Batal</Button><Button onClick={handleAdd}>Simpan</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={!!editId} onOpenChange={() => setEditId(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit User</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1"><Label>Email</Label><Input value={editForm.email} onChange={e => setEditForm({...editForm, email: e.target.value})} /></div>
            <div className="space-y-1"><Label>Nama</Label><Input value={editForm.nama_lengkap} onChange={e => setEditForm({...editForm, nama_lengkap: e.target.value})} /></div>
            <div className="space-y-1"><Label>Role</Label>
              <Select value={editForm.role_id} onValueChange={v => setEditForm({...editForm, role_id: v??"3"})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{ROLES.map(r => (<SelectItem key={r.id} value={String(r.id)}>{r.name}</SelectItem>))}</SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setEditId(null)}>Batal</Button><Button onClick={handleEdit}>Simpan</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog open={!!resetId} onOpenChange={() => setResetId(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Reset Password</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1"><Label>Password Baru (kosongkan untuk default)</Label><Input type="text" value={resetPw} onChange={e => setResetPw(e.target.value)} placeholder="Min 8 karakter" /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setResetId(null)}>Batal</Button><Button onClick={handleResetPw}>Reset</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
