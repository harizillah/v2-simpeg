import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

// Rute yang tidak perlu auth
const PUBLIC_ROUTES = [
  "/auth/login",
  "/auth/callback",
  "/auth/error",
];

// Rute khusus pegawai
const PEGAWAI_ROUTES = ["/pegawai"];

// Rute khusus admin
const ADMIN_ROUTES = ["/dashboard", "/pegawai", "/master-data", "/laporan", "/verifikasi", "/user-management"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Izinkan rute publik
  if (PUBLIC_ROUTES.some((route) => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Izinkan asset statis dan API internal Next.js
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/favicon.ico")
  ) {
    return NextResponse.next();
  }

  // Buat Supabase client untuk middleware
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { session } } = await supabase.auth.getSession();

  // Belum login → redirect ke login
  if (!session) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/login";
    return NextResponse.redirect(url);
  }

  // Ambil role user
  const { data: profile } = await supabase
    .from("profiles")
    .select("role_id")
    .eq("id", session.user.id)
    .single();

  const roleId = profile?.role_id ?? 0;

  // Redirect root ke dashboard sesuai role
  if (pathname === "/") {
    const url = request.nextUrl.clone();
    url.pathname = roleId === 3 ? "/pegawai/dashboard" : "/dashboard";
    return NextResponse.redirect(url);
  }

  // Pegawai (role_id 3) tidak boleh akses rute admin
  if (roleId === 3 && ADMIN_ROUTES.some((route) => pathname.startsWith(route))) {
    const url = request.nextUrl.clone();
    url.pathname = "/pegawai/dashboard";
    return NextResponse.redirect(url);
  }

  // Admin (role_id 1,2) tidak boleh akses rute pegawai
  if (roleId !== 3 && PEGAWAI_ROUTES.some((route) => pathname.startsWith(route))) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
