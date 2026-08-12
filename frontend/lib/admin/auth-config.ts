import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { ADMIN_SESSION_COOKIE } from "@/lib/admin/session";

export { ADMIN_SESSION_COOKIE };

const FRONTEND_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);

function parseEnvFile(filePath: string): Record<string, string> {
  if (!fs.existsSync(filePath)) {
    return {};
  }

  const values: Record<string, string> = {};

  for (const line of fs.readFileSync(filePath, "utf8").split(/\r?\n/u)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex === -1) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    let value = trimmed.slice(separatorIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    values[key] = value;
  }

  return values;
}

function readEnvValue(...keys: string[]): string | undefined {
  const sources = [
    process.env as Record<string, string | undefined>,
    parseEnvFile(path.join(FRONTEND_ROOT, ".env.local")),
    parseEnvFile(path.join(FRONTEND_ROOT, ".env")),
    parseEnvFile(path.join(FRONTEND_ROOT, "../backend/.env")),
  ];

  for (const key of keys) {
    for (const source of sources) {
      const value = source[key]?.trim();
      if (value) {
        return value;
      }
    }
  }

  return undefined;
}

export function getSupabaseAuthConfig() {
  const supabaseUrl = readEnvValue("NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_URL");
  const anonKey = readEnvValue(
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "SUPABASE_ANON_KEY",
  );

  if (!supabaseUrl || !anonKey) {
    throw new Error(
      "Supabase auth env vars are missing. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in frontend/.env.local.",
    );
  }

  return { supabaseUrl: supabaseUrl.replace(/\/$/, ""), anonKey };
}
