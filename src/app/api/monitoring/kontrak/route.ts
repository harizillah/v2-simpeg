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

  const { data, error, count } = await svc
    .from("pegawai")
    .select("id, nama_lengkap, nip, status_kepegawaian_id, tmt_awal, tmt_akhir, struktur:struktur_organisasi!pegawai_struktur_organisasi_id_fkey(nama)", { count: "exact" })
    .eq("is_deleted", false)
    .in("status_kepegawaian_id", [2, 3, 4]) // PPPK, Honorer, Kontrak
    .order("nama_lengkap")
    .range((page - 1) * limit, page * limit - 1);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const sekarang = new Date();
  const tigaBulan = new Date(sekarang);
  tigaBulan.setMonth(sekarang.getMonth() + 3);

  const result = (data || []).map((p: Record<string, unknown>) => {
    const tmtAkhir = p.tmt_akhir as string | null;
    let status = "no_data";
    let sisaHari = 0;
    if (tmtAkhir) {
      const akhir = new Date(tmtAkhir);
      sisaHari = Math.ceil((akhir.getTime() - sekarang.getTime()) / (1000 * 60 * 60 * 24));
      if (akhir < sekarang) status = "overdue";
      else if (akhir <= tigaBulan) status = "warning";
      else status = "normal";
    }
    return { ...p, status_kontrak: status, sisa_hari: sisaHari, total: count ?? 0 };
  });

  return NextResponse.json({ data: result, count: count ?? 0 });
}
