import { NextRequest, NextResponse } from "next/server";
import { tambahRiwayatKgb } from "@/lib/services/kgb";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Silakan login terlebih dahulu" }, { status: 401 });

  const body = await request.json();
  const result = await tambahRiwayatKgb(body);
  if (result.error) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json({ success: true, message: "Riwayat KGB berhasil ditambahkan" });
}
