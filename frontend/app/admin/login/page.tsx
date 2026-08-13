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
    <div className="min-h-full bg-background">
      <main className="mx-auto flex min-h-full w-full max-w-lg flex-col justify-center px-4 py-16 sm:px-6">
        <div className="space-y-6 rounded-xl border border-border bg-surface p-6">
          <div className="space-y-2 text-center">
            <h1 className="font-display text-2xl text-foreground">
              Admin sign in
            </h1>
            <p className="text-sm text-muted">
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
