import type { ReactNode } from "react";

import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";

type PageLoadingShellProps = {
  children: ReactNode;
  mainClassName?: string;
};

export function PageLoadingShell({
  children,
  mainClassName = "mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-10",
}: PageLoadingShellProps) {
  return (
    <div className="min-h-full bg-background">
      <SiteHeader />
      <main className={mainClassName}>{children}</main>
      <SiteFooter />
    </div>
  );
}
