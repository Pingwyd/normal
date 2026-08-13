import type {
  AccountSessionResponse,
  AccountSignupResponse,
  LocalFavoritePayload,
} from "@/lib/api/account-types";
import { apiPost } from "@/lib/api/client";

export async function signupAccount(
  username: string,
  password: string,
  localFavorites: LocalFavoritePayload[],
) {
  return apiPost<AccountSignupResponse>("/v1/accounts", {
    username,
    password,
    local_favorites: localFavorites,
  });
}

export async function loginAccount(
  username: string,
  password: string,
  localFavorites: LocalFavoritePayload[],
) {
  return apiPost<AccountSessionResponse>("/v1/accounts/login", {
    username,
    password,
    local_favorites: localFavorites,
  });
}

export async function recoverAccount(
  username: string,
  recoveryCode: string,
  newPassword: string,
) {
  return apiPost<AccountSessionResponse>("/v1/accounts/recover", {
    username,
    recovery_code: recoveryCode,
    new_password: newPassword,
  });
}
