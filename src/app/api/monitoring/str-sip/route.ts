import { NextResponse } from "next/server";
import { getMonitoringStrSip } from "@/lib/services/sertifikat";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Silakan login terlebih dahulu" }, { status: 401 });

  const result = await getMonitoringStrSip();
  return NextResponse.json({ data: result });
}
