"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

const NIK_REGEX = /^\d{16}$/;
const INTERNAL_DOMAIN = "@simpeg.internal";

function formatEmail(identifier: string): string {
  if (NIK_REGEX.test(identifier)) {
    return `nik_${identifier}${INTERNAL_DOMAIN}`;
  }
  return identifier;
}

export async function loginWithEmailOrNIK(
  identifier: string,
  password: string
): Promise<{ success: boolean; error?: string; role?: string }> {
  const email = formatEmail(identifier.trim());
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return {
      success: false,
      error: "Email/NIK atau password salah",
    };
  }

  if (!data.user) {
    return {
      success: false,
      error: "Gagal masuk. Silakan coba lagi.",
    };
  }

  // Cek role
  const { data: profile } = await supabase
    .from("profiles")
    .select("role_id, roles(name)")
    .eq("id", data.user.id)
    .single();

  if (!profile) {
    // Force logout — user tidak punya profile
    await supabase.auth.signOut();
    return {
      success: false,
      error: "Akun tidak memiliki akses. Hubungi administrator.",
    };
  }

  // Ambil nama role dari join (jika tersedia), fallback ke query langsung
  let roleName: string | null = null;
  if (profile.roles && typeof profile.roles === "object" && "name" in profile.roles) {
    roleName = (profile.roles as { name: string }).name;
  } else {
    const { data: roleData } = await supabase
      .from("roles")
      .select("name")
      .eq("id", profile.role_id)
      .single();
    roleName = roleData?.name ?? null;
  }

  return { success: true, role: roleName ?? undefined };
}

export async function logout(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/auth/login");
}

export async function getUserRole(
  userId: string
): Promise<string | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("roles(name)")
    .eq("id", userId)
    .single();

  if (data?.roles && typeof data.roles === "object" && "name" in data.roles) {
    return (data.roles as { name: string }).name;
  }
  return null;
}
