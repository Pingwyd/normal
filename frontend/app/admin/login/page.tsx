import { Suspense } from "react";
import { redirect } from "next/navigation";

import { AdminLoginForm } from "@/components/admin/admin-login-form";
import { getAdminSession } from "@/lib/admin/api";

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const session = await getAdminSession();
  const params = await searchParams;

  if (session) {
    redirect(params.next ?? "/admin/cards");
  }

  return (
    <div className="min-h-full bg-[#F2F1EC]">
      <main className="mx-auto flex min-h-full w-full max-w-lg flex-col justify-center px-4 py-16 sm:px-6">
        <div className="space-y-6 rounded-xl border border-[#D8D5CC] bg-white p-6">
          <div className="space-y-2 text-center">
            <h1 className="font-display text-2xl text-[#202B26]">Admin sign in</h1>
            <p className="text-sm text-[#5A6560]">
              Internal access only. No public entry points.
            </p>
          </div>
          <Suspense fallback={null}>
            <AdminLoginForm />
          </Suspense>
        </div>
      </main>
    </div>
  );
}
