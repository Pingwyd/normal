export function findMissingDraftTags(
  suggestedTags: string[] | undefined,
  existingTagNames: string[],
): string[] {
  const existing = new Set(existingTagNames.map((name) => name.toLowerCase()));
  const missing: string[] = [];
  const seen = new Set<string>();

  for (const name of suggestedTags ?? []) {
    const trimmed = name.trim();
    const key = trimmed.toLowerCase();
    if (!trimmed || seen.has(key)) {
      continue;
    }
    seen.add(key);
    if (!existing.has(key)) {
      missing.push(trimmed);
    }
  }

  return missing;
}
