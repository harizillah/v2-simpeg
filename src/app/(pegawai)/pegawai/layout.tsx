import { Header } from "@/components/admin/header";

export default function PegawaiLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      <Header />
      <main>
        <div className="container mx-auto p-4 lg:p-6">{children}</div>
      </main>
    </div>
  );
}
