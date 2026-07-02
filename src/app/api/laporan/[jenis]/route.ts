import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ jenis: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Silakan login terlebih dahulu" }, { status: 401 });

  const { jenis } = await params;
  const svc = createServiceClient();
  const exportMode = request.nextUrl.searchParams.get("export") === "xlsx";

  let data: Record<string, unknown>[] = [];
  let filename = `laporan-${jenis}.xlsx`;

  switch (jenis) {
    case "duk": {
      const { data: d } = await svc.from("pegawai")
        .select("nama_lengkap, nip, golongan_id, tmt_pangkat, jabatan_fungsional_id, struktur_organisasi_id, golongan:golongan!pegawai_golongan_id_fkey(nama, pangkat, level), jabatan:jabatan_fungsional!pegawai_jabatan_fungsional_id_fkey(nama), struktur:struktur_organisasi!pegawai_struktur_organisasi_id_fkey(nama)")
        .eq("is_deleted", false).order("golongan_id");
      data = (d || []).map((r: Record<string, unknown>) => ({
        Nama: r.nama_lengkap, NIP: r.nip,
        Golongan: (r.golongan as { nama?: string })?.nama, Pangkat: (r.golongan as { pangkat?: string })?.pangkat,
        TMT_Pangkat: r.tmt_pangkat, Jabatan: (r.jabatan as { nama?: string })?.nama,
        Unit: (r.struktur as { nama?: string })?.nama,
      }));
      filename = "laporan-duk.xlsx";
      break;
    }
    case "jenis-tenaga": {
      const { data: d } = await svc.from("pegawai")
        .select("jenis_tenaga_id, jenis_tenaga:master_jenis_tenaga!pegawai_jenis_tenaga_id_fkey(nama), kategori:master_kategori_tenaga(nama)")
        .eq("is_deleted", false);
      const grouped = new Map<string, number>();
      (d || []).forEach((r: Record<string, unknown>) => {
        const nama = String((r.jenis_tenaga as { nama?: string })?.nama || "Belum diisi");
        grouped.set(nama, (grouped.get(nama) || 0) + 1);
      });
      data = [...grouped.entries()].map(([jenis, jumlah]) => ({ Jenis_Tenaga: jenis, Jumlah: jumlah }));
      filename = "laporan-jenis-tenaga.xlsx";
      break;
    }
    case "pensiun": {
      const { data: d } = await svc.from("pegawai")
        .select("nama_lengkap, nip, tanggal_lahir, struktur:struktur_organisasi!pegawai_struktur_organisasi_id_fkey(nama)").eq("is_deleted", false).not("tanggal_lahir", "is", null);
      data = (d || []).map((r: Record<string, unknown>) => {
        const tglLahir = new Date(String(r.tanggal_lahir));
        const bup = new Date(tglLahir); bup.setFullYear(tglLahir.getFullYear() + 58);
        return { Nama: r.nama_lengkap, NIP: r.nip, Tanggal_Lahir: r.tanggal_lahir, Usia: new Date().getFullYear() - tglLahir.getFullYear(), BUP: 58, Tgl_Pensiun: bup.toISOString().split("T")[0], Unit: (r.struktur as { nama?: string })?.nama };
      });
      filename = "laporan-pensiun.xlsx";
      break;
    }
    default: {
      // Generic: ambil semua kolom pegawai
      const { data: d } = await svc.from("pegawai").select("*").eq("is_deleted", false).limit(500);
      data = (d || []) as Record<string, unknown>[];
      break;
    }
  }

  if (exportMode) {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, "Laporan");
    const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

    return new NextResponse(buf, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${encodeURIComponent(filename)}"`,
      },
    });
  }

  return NextResponse.json({ data });
}
