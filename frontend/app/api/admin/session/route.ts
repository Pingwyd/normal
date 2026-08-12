import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { getSupabaseAuthConfig } from "@/lib/admin/auth-config";
import { ADMIN_SESSION_COOKIE } from "@/lib/admin/session";

export const runtime = "nodejs";
export async function POST(request: Request) {
  let email = "";
  let password = "";

  try {
    const body = (await request.json()) as { email?: string; password?: string };
    email = body.email?.trim() ?? "";
    password = body.password ?? "";
  } catch {
    return NextResponse.json(
      { error: "Invalid request body." },
      { status: 400 },
    );
  }

  if (!email || !password) {
    return NextResponse.json(
      { error: "Email and password are required." },
      { status: 400 },
    );
  }

  const { supabaseUrl, anonKey } = getSupabaseAuthConfig();

  const authResponse = await fetch(
    `${supabaseUrl}/auth/v1/token?grant_type=password`,
    {
      method: "POST",
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    },
  );

  if (!authResponse.ok) {
    return NextResponse.json(
      { error: "Sign-in failed. Check your email and password." },
      { status: 401 },
    );
  }

  const authBody = (await authResponse.json()) as {
    access_token?: string;
    expires_in?: number;
  };

  if (!authBody.access_token) {
    return NextResponse.json(
      { error: "Sign-in did not return an access token." },
      { status: 401 },
    );
  }

  const cookieStore = await cookies();
  cookieStore.set(ADMIN_SESSION_COOKIE, authBody.access_token, {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: authBody.expires_in ?? 3600,
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_SESSION_COOKIE);
  return NextResponse.json({ ok: true });
}
