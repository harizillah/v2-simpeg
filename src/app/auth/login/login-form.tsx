"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { loginWithEmailOrNIK } from "@/lib/helpers/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { LogIn, Eye, EyeOff } from "lucide-react";

export function LoginForm() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!identifier.trim() || !password) {
      toast.error("Form belum lengkap", {
        description: "Silakan isi NIK/email dan password.",
      });
      return;
    }

    setIsLoading(true);
    try {
      const result = await loginWithEmailOrNIK(identifier, password);

      if (!result.success) {
        toast.error("Gagal masuk", {
          description: result.error || "Terjadi kesalahan.",
        });
        return;
      }

      toast.success("Berhasil masuk", {
        description: "Selamat datang di SIMPEG RSUD.",
      });

      router.refresh();

      if (result.role === "pegawai") {
        router.push("/pegawai/dashboard");
      } else {
        router.push("/dashboard");
      }
    } catch {
      toast.error("Gagal masuk", {
        description: "Terjadi kesalahan. Silakan coba lagi.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-1 text-center">
        <CardTitle className="text-2xl font-bold">SIMPEG RSUD</CardTitle>
        <CardDescription>
          Masuk menggunakan NIK (16 digit) atau email
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="identifier">NIK atau Email</Label>
            <Input
              id="identifier"
              type="text"
              placeholder="Masukkan NIK 16 digit atau email"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              disabled={isLoading}
              autoComplete="username"
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Masukkan password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                autoComplete="current-password"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full px-3"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              "Memproses..."
            ) : (
              <>
                <LogIn className="mr-2 h-4 w-4" />
                Masuk
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
