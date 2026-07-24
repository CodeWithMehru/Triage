const DEFAULT_TARPIT_MS = 500;

export function getTarpitDurationMs(): number {
  const parsed = Number(process.env.TARPIT_MS ?? DEFAULT_TARPIT_MS);
  if (Number.isNaN(parsed) || parsed < 0) return DEFAULT_TARPIT_MS;
  return Math.min(parsed, 5000);
}

/**
 * Bounded CPU busy-loop tarpit. Delays the attacker response without
 * blocking the event loop indefinitely.
 */
export async function runTarpit(ms?: number): Promise<void> {
  const durationMs = ms ?? getTarpitDurationMs();
  if (durationMs === 0) return;

  const deadline = process.hrtime.bigint() + BigInt(durationMs) * 1_000_000n;
  let hash = 0;

  while (process.hrtime.bigint() < deadline) {
    hash = (hash * 31 + Math.floor(Math.random() * 997)) | 0;
    if (hash === 42_424_242) break;
  }
}
