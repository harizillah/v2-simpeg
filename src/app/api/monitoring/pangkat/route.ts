import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Silakan login terlebih dahulu" }, { status: 401 });

  const svc = createServiceClient();
  const sp = request.nextUrl.searchParams;
  const page = Number(sp.get("page")) || 1;
  const limit = Number(sp.get("limit")) || 20;
  const tahun = Number(sp.get("tahun")) || new Date().getFullYear();

  const { data, error, count } = await svc
    .from("pegawai")
    .select("id, nama_lengkap, nip, tmt_pangkat, golongan_id, status_kepegawaian_id, struktur:struktur_organisasi!pegawai_struktur_organisasi_id_fkey(nama), golongan:golongan!pegawai_golongan_id_fkey(nama, pangkat)", { count: "exact" })
    .eq("is_deleted", false)
    .in("status_kepegawaian_id", [1, 2])
    .not("tmt_pangkat", "is", null)
    .order("tmt_pangkat");

  if (error || !data) return NextResponse.json({ data: [], count: 0 });

  const result = data.map((p: Record<string, unknown>) => {
    const tmt = new Date(String(p.tmt_pangkat));
    const estimasi = new Date(tmt);
    estimasi.setFullYear(tmt.getFullYear() + 4);
    return { ...p, estimasi_pangkat: estimasi.toISOString().split("T")[0], tahun_estimasi: estimasi.getFullYear() };
  });

  const filtered = result.filter((r: { tahun_estimasi: number }) => r.tahun_estimasi === tahun);
  const paginated = filtered.slice((page - 1) * limit, page * limit);

  return NextResponse.json({ data: paginated, count: filtered.length });
}
