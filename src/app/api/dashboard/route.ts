import { NextResponse } from "next/server";
import { getDashboardStats } from "@/lib/services/pegawai";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Silakan login terlebih dahulu" }, { status: 401 });
  }

  const result = await getDashboardStats();

  return NextResponse.json({ data: result });
}
