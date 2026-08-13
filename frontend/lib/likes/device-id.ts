export const DEVICE_ID_STORAGE_KEY = "normal:device_id";

const DEVICE_ID_MIN_LENGTH = 8;

export function getOrCreateDeviceId(): string {
  if (typeof window === "undefined") {
    return "";
  }

  const existing = window.localStorage.getItem(DEVICE_ID_STORAGE_KEY);
  if (existing && existing.length >= DEVICE_ID_MIN_LENGTH) {
    return existing;
  }

  const deviceId = crypto.randomUUID();
  window.localStorage.setItem(DEVICE_ID_STORAGE_KEY, deviceId);
  return deviceId;
}
