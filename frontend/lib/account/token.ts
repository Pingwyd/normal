type AccountTokenPayload = {
  sub?: string;
  type?: string;
};

export function parseAccountIdFromAccessToken(token: string): string | null {
  const segments = token.split(".");
  if (segments.length !== 3) {
    return null;
  }

  try {
    const payloadJson = Buffer.from(segments[1], "base64url").toString("utf8");
    const payload = JSON.parse(payloadJson) as AccountTokenPayload;
    if (
      payload.type !== "account" ||
      typeof payload.sub !== "string" ||
      !payload.sub
    ) {
      return null;
    }
    return payload.sub;
  } catch {
    return null;
  }
}
