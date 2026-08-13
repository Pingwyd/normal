"use client";

import type { ReactNode } from "react";

import { FavoritesProvider } from "@/components/favorites/favorites-provider";

type AppProvidersProps = {
  children: ReactNode;
};

export function AppProviders({ children }: AppProvidersProps) {
  return <FavoritesProvider>{children}</FavoritesProvider>;
}
