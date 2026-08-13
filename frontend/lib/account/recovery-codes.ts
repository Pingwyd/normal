export function downloadRecoveryCodes(username: string, codes: string[]): void {
  const body = [
    "Normal recovery codes",
    `Account: ${username}`,
    "Store these somewhere safe. Each code works once.",
    "",
    ...codes,
  ].join("\n");

  const blob = new Blob([body], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `normal-recovery-codes-${username}.txt`;
  anchor.click();
  URL.revokeObjectURL(url);
}

export async function copyRecoveryCodes(codes: string[]): Promise<void> {
  await navigator.clipboard.writeText(codes.join("\n"));
}
