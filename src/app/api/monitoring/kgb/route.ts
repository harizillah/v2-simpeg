import { NextRequest, NextResponse } from "next/server";
import { getMonitoringKgb } from "@/lib/services/kgb";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Silakan login terlebih dahulu" }, { status: 401 });

  const sp = request.nextUrl.searchParams;
  const result = await getMonitoringKgb({
    status: (sp.get("status") as "normal" | "warning" | "overdue" | "no_data") || undefined,
    unitKerjaId: sp.get("unit_kerja_id") ? Number(sp.get("unit_kerja_id")) : undefined,
    page: sp.get("page") ? Number(sp.get("page")) : 1,
    limit: sp.get("limit") ? Number(sp.get("limit")) : 20,
  });

  if (result.error) return NextResponse.json({ error: result.error }, { status: 500 });
  return NextResponse.json({ data: result.data, count: result.count, statistik: result.statistik });
}
