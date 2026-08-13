import type { ReactNode } from "react";

import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";

type PublicPageShellProps = {
  children: ReactNode;
  mainClassName?: string;
};

export function PublicPageShell({
  children,
  mainClassName = "mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-10",
}: PublicPageShellProps) {
  return (
    <div className="min-h-full bg-[#F2F1EC]">
      <SiteHeader />
      <main className={mainClassName}>{children}</main>
      <SiteFooter />
    </div>
  );
}
