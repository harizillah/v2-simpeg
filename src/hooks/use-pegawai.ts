"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { PegawaiRow } from "@/lib/services/pegawai";

interface PegawaiListResponse {
  data: PegawaiRow[];
  count: number;
  page: number;
  limit: number;
}

interface PegawaiFilter {
  search?: string;
  isDeleted?: boolean;
  page?: number;
  limit?: number;
}

async function fetchPegawaiList(filter: PegawaiFilter): Promise<PegawaiListResponse> {
  const params = new URLSearchParams();
  if (filter.search) params.set("search", filter.search);
  if (filter.isDeleted) params.set("is_deleted", "true");
  if (filter.page) params.set("page", String(filter.page));
  if (filter.limit) params.set("limit", String(filter.limit));

  const res = await fetch(`/api/pegawai?${params}`);
  if (!res.ok) throw new Error("Gagal memuat data pegawai");
  return res.json();
}

async function fetchPegawaiDetail(id: string) {
  const res = await fetch(`/api/pegawai/${id}`);
  if (!res.ok) throw new Error("Gagal memuat detail pegawai");
  const json = await res.json();
  return json.data;
}

export function usePegawaiList(filter: PegawaiFilter = {}) {
  return useQuery({
    queryKey: ["pegawai-list", filter],
    queryFn: () => fetchPegawaiList(filter),
  });
}

export function usePegawaiDetail(id: string) {
  return useQuery({
    queryKey: ["pegawai-detail", id],
    queryFn: () => fetchPegawaiDetail(id),
    enabled: !!id,
  });
}

export function useCreatePegawai() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await fetch("/api/pegawai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Gagal menambah pegawai");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pegawai-list"] });
      toast.success("Berhasil", {
        description: "Pegawai berhasil ditambahkan",
      });
    },
    onError: (err: Error) => {
      toast.error("Gagal", { description: err.message });
    },
  });
}

export function useUpdatePegawai() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Record<string, unknown> }) => {
      const res = await fetch(`/api/pegawai/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Gagal memperbarui pegawai");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pegawai-list"] });
      queryClient.invalidateQueries({ queryKey: ["pegawai-detail"] });
      toast.success("Berhasil", {
        description: "Data pegawai berhasil diperbarui",
      });
    },
    onError: (err: Error) => {
      toast.error("Gagal", { description: err.message });
    },
  });
}

export function useSoftDeletePegawai() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/pegawai/${id}/soft-delete`, { method: "POST" });
      if (!res.ok) throw new Error("Gagal menonaktifkan pegawai");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pegawai-list"] });
      toast.success("Berhasil", {
        description: "Pegawai berhasil dinonaktifkan",
      });
    },
    onError: (err: Error) => {
      toast.error("Gagal", { description: err.message });
    },
  });
}

export function useRestorePegawai() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/pegawai/${id}/restore`, { method: "POST" });
      if (!res.ok) throw new Error("Gagal memulihkan pegawai");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pegawai-list"] });
      toast.success("Berhasil", {
        description: "Pegawai berhasil dipulihkan",
      });
    },
    onError: (err: Error) => {
      toast.error("Gagal", { description: err.message });
    },
  });
}
