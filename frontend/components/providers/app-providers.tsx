"use client";

import type { ReactNode } from "react";

import { FavoritesProvider } from "@/components/favorites/favorites-provider";
import { PreferencesProvider } from "@/components/preferences/preferences-provider";

type AppProvidersProps = {
  children: ReactNode;
};

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <FavoritesProvider>
      <PreferencesProvider>{children}</PreferencesProvider>
    </FavoritesProvider>
  );
}
