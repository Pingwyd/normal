import { AdminNav } from "@/components/admin/admin-nav";
import { requireAdminSession } from "@/lib/admin/api";

export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireAdminSession();

  return (
    <div className="min-h-full bg-[#F2F1EC]">
      <AdminNav displayName={session.displayName} role={session.role} />
      <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
        {children}
      </main>
    </div>
  );
}
