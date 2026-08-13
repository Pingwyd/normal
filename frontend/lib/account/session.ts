export const ACCOUNT_SESSION_COOKIE = "account_session";

export type AccountSessionAccount = {
  id: string;
};

export type AccountSessionResponse = {
  account: AccountSessionAccount | null;
};
