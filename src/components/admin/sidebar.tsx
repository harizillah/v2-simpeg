"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  LayoutDashboard,
  Users,
  Database,
  FileText,
  ClipboardCheck,
  Shield,
  Menu,
  LogOut,
  AlertTriangle,
} from "lucide-react";
import { logout } from "@/lib/helpers/auth";

interface NavItem {
  title: string;
  href: string;
  icon: React.ReactNode;
  roles: number[];
}

const navItems: NavItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: <LayoutDashboard className="h-5 w-5" />,
    roles: [1, 2],
  },
  {
    title: "Data Pegawai",
    href: "/pegawai",
    icon: <Users className="h-5 w-5" />,
    roles: [1, 2],
  },
  {
    title: "Master Data",
    href: "/master-data",
    icon: <Database className="h-5 w-5" />,
    roles: [1, 2],
  },
  {
    title: "Monitoring",
    href: "/monitoring",
    icon: <AlertTriangle className="h-5 w-5" />,
    roles: [1, 2],
  },
  {
    title: "Laporan",
    href: "/laporan",
    icon: <FileText className="h-5 w-5" />,
    roles: [1, 2],
  },
  {
    title: "Verifikasi",
    href: "/verifikasi",
    icon: <ClipboardCheck className="h-5 w-5" />,
    roles: [1, 2],
  },
  {
    title: "Manajemen User",
    href: "/user-management",
    icon: <Shield className="h-5 w-5" />,
    roles: [1],
  },
];

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="flex h-14 items-center border-b px-4">
        <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
          <Shield className="h-6 w-6 text-primary" />
          <span>SIMPEG RSUD</span>
        </Link>
      </div>

      {/* Navigasi */}
      <ScrollArea className="flex-1 px-2 py-4">
        <nav className="space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                className={cn(
                  "inline-flex w-full items-center gap-3 rounded-lg px-2.5 py-1.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-secondary text-secondary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                {item.icon}
                <span>{item.title}</span>
              </Link>
            );
          })}
        </nav>
      </ScrollArea>

      {/* Logout */}
      <div className="border-t p-2">
        <form action={logout}>
          <Button variant="ghost" className="w-full justify-start gap-3 text-muted-foreground">
            <LogOut className="h-5 w-5" />
            <span>Keluar</span>
          </Button>
        </form>
      </div>
    </div>
  );
}

export function Sidebar() {
  return (
    <>
      {/* Desktop sidebar */}
      <aside className="fixed left-0 top-0 z-40 hidden h-screen w-64 border-r bg-background lg:block">
        <SidebarContent />
      </aside>

      {/* Mobile sidebar */}
      <Sheet>
        <SheetTrigger>
          <Button variant="ghost" size="icon" className="lg:hidden">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Buka menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0">
          <SidebarContent />
        </SheetContent>
      </Sheet>
    </>
  );
}
