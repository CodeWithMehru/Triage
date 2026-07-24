#!/usr/bin/env node
/**
 * Inline smoke tests — no external services required.
 * Run: node --experimental-vm-modules api/smoke-test.mjs
 * Or from api/: npx tsx smoke-test.ts
 */
import { scanSurface, THREAT_RULES } from "./src/rules/threatPatterns.js";
import { runTarpit, getTarpitDurationMs } from "./src/services/tarpit.js";

let passed = 0;
let failed = 0;

function assert(name: string, condition: boolean) {
  if (condition) {
    console.log(`  ✓ ${name}`);
    passed++;
  } else {
    console.error(`  ✗ ${name}`);
    failed++;
  }
}

console.log("\n=== Threat Pattern Detection ===\n");

const sqli = scanSurface("query", "' OR 1=1--");
assert("SQLi OR 1=1 detected", sqli?.type === "SQL_INJECTION");

const union = scanSurface("body", "UNION SELECT password FROM users");
assert("SQLi UNION SELECT detected", union?.type === "SQL_INJECTION");

const xss = scanSurface("url", "<script>alert(1)</script>");
assert("XSS script tag detected", xss?.type === "XSS");

const leak = scanSurface(
  "body",
  "sk-1234567890abcdefghijklmnopqrstuvwxyz"
);
assert("OpenAI key leak detected", leak?.type === "SENSITIVE_DATA_LEAK");

const clean = scanSurface("query", "normal search term");
assert("Clean query passes", clean === null);

console.log(`\n  Rules loaded: ${THREAT_RULES.length}`);

console.log("\n=== Tarpit ===\n");
const tarpitMs = getTarpitDurationMs();
assert("Tarpit default is 500ms", tarpitMs === 500);

const start = Date.now();
await runTarpit(50);
const elapsed = Date.now() - start;
assert("Tarpit delays ~50ms", elapsed >= 40);

console.log(`\n=== Results: ${passed} passed, ${failed} failed ===\n`);
process.exit(failed > 0 ? 1 : 0);
