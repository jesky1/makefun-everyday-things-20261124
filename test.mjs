import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createHash } from "node:crypto";

const EXPECTED =
  "A toaster is a little sunbed for bread: a slice lies down between glowing hot wires, turns golden brown on both sides, and pops up when its tan is done.\n" +
  "The sunbed picture works because both use slow, even heat to brown the outside while the inside stays soft, but it leaves out the timer and the spring that decide when the bread jumps up.";

function runOnce() {
  const dir = mkdtempSync(join(tmpdir(), "everyday-things-"));
  const r = spawnSync(process.execPath, ["main.ts"], {
    cwd: import.meta.dirname,
    env: { ...process.env, MAKEFUN_OUTPUT_DIR: dir },
    encoding: "utf8",
  });
  assert.equal(r.status, 0, `main.ts failed: ${r.stderr}`);
  return readFileSync(join(dir, "entry.txt"));
}

test("entry is two lines, 1-400 chars, deterministic across runs", () => {
  const first = runOnce();
  const second = runOnce();
  assert.equal(
    createHash("sha256").update(first).digest("hex"),
    createHash("sha256").update(second).digest("hex"),
    "two runs must produce byte-identical entry.txt",
  );
  const text = first.toString("utf8");
  assert.equal(text, EXPECTED);
  assert.ok(!text.endsWith("\n"), "no trailing newline");
  const lines = text.split("\n");
  assert.equal(lines.length, 2, "exactly two lines");
  const chars = [...text].length;
  assert.ok(chars >= 1 && chars <= 400, `length ${chars} must be 1-400`);
  assert.ok(text.trim().length > 0, "not only whitespace");
  for (const line of lines) {
    const terminators = line.match(/[.!?]/g) ?? [];
    assert.equal(terminators.length, 1, "each line is exactly one sentence");
    assert.ok(line.endsWith("."), "each line ends with a period");
  }
});

test("entry length is within the competition gate", () => {
  const chars = [...EXPECTED].length;
  assert.ok(chars >= 1 && chars <= 400, `EXPECTED is ${chars} chars`);
  console.log(`entry length: ${chars} characters, ${EXPECTED.split("\n").length} lines`);
});
