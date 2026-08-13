export type PushSubscriptionPayload = {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  enabled: boolean;
};

export type PushSubscriptionResponse = {
  id: string;
  endpoint: string;
  enabled: boolean;
  account_id: string | null;
  reassigned: boolean;
};

export type NewsletterSubscriptionResponse = {
  email: string;
  enabled: boolean;
};

export async function upsertPushSubscription(
  payload: PushSubscriptionPayload,
): Promise<PushSubscriptionResponse> {
  const response = await fetch("/api/push-subscriptions", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const body = (await response.json()) as {
    data: PushSubscriptionResponse | null;
    error: { code: string; message: string } | null;
  };

  if (!response.ok || body.error || !body.data) {
    throw new Error(body.error?.message ?? "Could not update push notifications.");
  }

  return body.data;
}

export async function updateNewsletterSubscription(
  email: string,
  enabled: boolean,
): Promise<NewsletterSubscriptionResponse> {
  const response = await fetch("/api/newsletter", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, enabled }),
  });

  const body = (await response.json()) as {
    data: NewsletterSubscriptionResponse | null;
    error: { code: string; message: string } | null;
  };

  if (!response.ok || body.error || !body.data) {
    throw new Error(body.error?.message ?? "Could not update newsletter settings.");
  }

  return body.data;
}

export async function unsubscribeNewsletterByToken(
  token: string,
): Promise<NewsletterSubscriptionResponse> {
  const response = await fetch(
    `/api/newsletter/unsubscribe?token=${encodeURIComponent(token)}`,
    {
      method: "GET",
      cache: "no-store",
    },
  );

  const body = (await response.json()) as {
    data: NewsletterSubscriptionResponse | null;
    error: { code: string; message: string } | null;
  };

  if (!response.ok || body.error || !body.data) {
    throw new Error(body.error?.message ?? "Could not unsubscribe from the newsletter.");
  }

  return body.data;
}
