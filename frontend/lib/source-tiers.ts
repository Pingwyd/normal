const TIER_LABELS: Record<string, string> = {
  peer_reviewed: "Peer reviewed",
  expert_written: "Expert written",
  self_report: "Self-reported survey",
};

export function getSourceTierLabel(tier: string): string {
  return TIER_LABELS[tier] ?? tier.replaceAll("_", " ");
}
