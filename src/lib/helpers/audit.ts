"use server";

import { createServiceClient } from "@/lib/supabase/service";

type ChangeType = "INSERT" | "UPDATE" | "DELETE" | "RESTORE";

export async function logPegawaiChange(params: {
  pegawaiId: string;
  changeType: ChangeType;
  fieldName?: string;
  oldValue?: string;
  newValue?: string;
  changedBy: string;
  changedByName?: string;
}): Promise<void> {
  const supabase = createServiceClient();

  await supabase.from("pegawai_audit_log").insert({
    pegawai_id: params.pegawaiId,
    change_type: params.changeType,
    field_name: params.fieldName ?? null,
    old_value: params.oldValue ?? null,
    new_value: params.newValue ?? null,
    changed_by: params.changedBy,
    changed_by_name: params.changedByName ?? null,
  });
}

export async function logUserManagement(params: {
  targetUserId: string;
  aksi: string;
  dilakukanOleh: string;
  nilaiLama?: Record<string, unknown>;
  nilaiBaru?: Record<string, unknown>;
}): Promise<void> {
  const supabase = createServiceClient();

  await supabase.from("user_management_log").insert({
    target_user_id: params.targetUserId,
    aksi: params.aksi,
    dilakukan_oleh: params.dilakukanOleh,
    nilai_lama: params.nilaiLama ?? null,
    nilai_baru: params.nilaiBaru ?? null,
  });
}
