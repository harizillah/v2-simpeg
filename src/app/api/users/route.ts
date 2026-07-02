import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { createClient } from "@/lib/supabase/server";
import { logUserManagement } from "@/lib/helpers/audit";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Silakan login terlebih dahulu" }, { status: 401 });

  const svc = createServiceClient();
  const { data } = await svc
    .from("profiles")
    .select("id, nama_lengkap, role_id, created_at, roles(name)");

  // Get emails from auth.users via service
  const { data: users } = await svc.auth.admin.listUsers();
  const emailMap = new Map((users?.users || []).map((u: { id: string; email?: string }) => [u.id, u.email]));

  const result = (data || []).map((p) => ({
    ...p,
    email: emailMap.get(p.id) || "-",
  }));

  return NextResponse.json({ data: result });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Silakan login terlebih dahulu" }, { status: 401 });

  const body = await request.json();
  const svc = createServiceClient();

  // Create auth user
  const { data: authData, error: authError } = await svc.auth.admin.createUser({
    email: body.email,
    password: body.password || "rsud12345",
    email_confirm: true,
  });

  if (authError) return NextResponse.json({ error: authError.message }, { status: 400 });

  // Update profile with nama + role
  await svc.from("profiles").update({ nama_lengkap: body.nama_lengkap || "", role_id: body.role_id || 3 }).eq("id", authData.user.id);

  await logUserManagement({
    targetUserId: authData.user.id,
    aksi: "create_user",
    dilakukanOleh: user.id,
    nilaiBaru: { email: body.email, role_id: body.role_id },
  });

  return NextResponse.json({ success: true, message: "User berhasil dibuat" });
}
