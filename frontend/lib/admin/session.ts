export const ADMIN_SESSION_COOKIE = "admin_session";

export type AdminSession = {
  accessToken: string;
  role: "founder" | "clinical_reviewer";
  displayName: string;
};
