import { NextRequest, NextResponse } from "next/server";
import { validateFile, uploadDokumen } from "@/lib/services/dokumen";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Silakan login terlebih dahulu" }, { status: 401 });

  const formData = await request.formData();
  const file = formData.get("file") as File;
  const pegawaiId = formData.get("pegawai_id") as string;
  const kategori = formData.get("kategori_dokumen") as string;
  const nama = formData.get("nama_dokumen") as string;

  if (!file || !pegawaiId || !kategori || !nama)
    return NextResponse.json({ error: "Data tidak lengkap" }, { status: 400 });

  const fileError = validateFile({ type: file.type, size: file.size });
  if (fileError) return NextResponse.json({ error: fileError }, { status: 400 });

  const result = await uploadDokumen({
    pegawaiId, file, kategoriDokumen: kategori, namaDokumen: nama,
    nomorDokumen: (formData.get("nomor_dokumen") as string) || undefined,
    tanggalDokumen: (formData.get("tanggal_dokumen") as string) || undefined,
    tanggalBerakhir: (formData.get("tanggal_berakhir") as string) || undefined,
    uploadedBy: user.id,
  });

  if (result.error) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json({ success: true, message: "Dokumen berhasil diunggah", data: result.data });
}
