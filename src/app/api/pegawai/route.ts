import { NextRequest, NextResponse } from "next/server";
import { getPegawaiList, createPegawai } from "@/lib/services/pegawai";
import { pegawaiSchema } from "@/lib/validators/pegawai";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Silakan login terlebih dahulu" }, { status: 401 });
  }

  const { searchParams } = request.nextUrl;

  const filter = {
    search: searchParams.get("search") ?? undefined,
    statusKepegawaianId: searchParams.get("status_kepegawaian_id")
      ? Number(searchParams.get("status_kepegawaian_id"))
      : undefined,
    strukturOrganisasiId: searchParams.get("struktur_organisasi_id")
      ? Number(searchParams.get("struktur_organisasi_id"))
      : undefined,
    isDeleted: searchParams.get("is_deleted") === "true",
    page: searchParams.get("page") ? Number(searchParams.get("page")) : 1,
    limit: searchParams.get("limit") ? Number(searchParams.get("limit")) : 10,
  };

  const result = await getPegawaiList(filter);

  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  return NextResponse.json({
    data: result.data,
    count: result.count,
    page: filter.page,
    limit: filter.limit,
  });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Silakan login terlebih dahulu" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = pegawaiSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Data tidak valid", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("nama_lengkap")
    .eq("id", user.id)
    .single();

  const result = await createPegawai(
    parsed.data,
    user.id,
    profile?.nama_lengkap ?? user.email ?? "Unknown"
  );

  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({
    success: true,
    message: "Pegawai berhasil ditambahkan",
    data: result.data,
  });
}
