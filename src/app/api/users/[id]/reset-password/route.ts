import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { createClient } from "@/lib/supabase/server";
import { logUserManagement } from "@/lib/helpers/audit";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Silakan login terlebih dahulu" }, { status: 401 });

  const { id } = await params;
  const { password } = await request.json();
  const svc = createServiceClient();

  const { error } = await svc.auth.admin.updateUserById(id, { password: password || "rsud12345" });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  await logUserManagement({ targetUserId: id, aksi: "reset_password", dilakukanOleh: user.id });

  return NextResponse.json({ success: true, message: "Password berhasil direset" });
}
