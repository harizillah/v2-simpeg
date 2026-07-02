import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { createClient } from "@/lib/supabase/server";
import { logUserManagement } from "@/lib/helpers/audit";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Silakan login terlebih dahulu" }, { status: 401 });

  const { id } = await params;
  const body = await request.json();
  const svc = createServiceClient();

  await svc.from("profiles").update({ role_id: body.role_id, nama_lengkap: body.nama_lengkap }).eq("id", id);

  if (body.email) {
    await svc.auth.admin.updateUserById(id, { email: body.email });
  }

  await logUserManagement({ targetUserId: id, aksi: "change_role", dilakukanOleh: user.id, nilaiLama: {}, nilaiBaru: { role_id: body.role_id } });

  return NextResponse.json({ success: true, message: "User berhasil diperbarui" });
}
