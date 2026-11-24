import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

// Importing main.ts runs main() once (writes entry.txt to the temp dir
// set via MAKEFUN_OUTPUT_DIR); we only need its exported validator here.
process.env.MAKEFUN_OUTPUT_DIR = mkdtempSync(join(tmpdir(), "everyday-neg-"));
const { validateEntry, ENTRY } = await import("./main.ts");

const line1 =
  "A toaster is a little sunbed for bread: a slice lies down between glowing hot wires, turns golden brown on both sides, and pops up when its tan is done.";
const line2 =
  "The sunbed picture works because both use slow, even heat to brown the outside while the inside stays soft, but it leaves out the timer and the spring that decide when the bread jumps up.";

test("valid entry passes", () => {
  assert.equal(validateEntry(ENTRY), ENTRY);
});

test("entry over 400 characters is rejected", () => {
  assert.throws(() => validateEntry(line1 + "\n" + line2 + "x".repeat(200)), /400/);
});

test("one line is rejected", () => {
  assert.throws(() => validateEntry(line1), /exactly two lines/);
});

test("three lines are rejected", () => {
  assert.throws(() => validateEntry(line1 + "\n" + line2 + "\nExtra line."), /exactly two lines/);
});

test("whitespace-only entry is rejected", () => {
  assert.throws(() => validateEntry("   \n   "), /only whitespace|empty/);
});

test("empty entry is rejected", () => {
  assert.throws(() => validateEntry(""), /1-400/);
});

test("trailing newline is rejected", () => {
  assert.throws(() => validateEntry(ENTRY + "\n"), /trailing whitespace/);
});

test("two sentences in line 1 are rejected", () => {
  assert.throws(
    () => validateEntry("A toaster is a sunbed. It pops up.\n" + line2),
    /exactly one sentence/,
  );
});

test("control character is rejected", () => {
  assert.throws(() => validateEntry(line1 + "\n" + line2.replace("timer", "ti\x07mer")), /control characters/);
});

test("entry without the toaster in line 1 is rejected", () => {
  assert.throws(
    () => validateEntry(line1.replace("A toaster", "A machine") + "\n" + line2),
    /toaster/,
  );
});

test("line 2 without explaining why is rejected", () => {
  assert.throws(
    () => validateEntry(line1 + "\n" + line2.replace("because both use", "and both use")),
    /why the analogy works/,
  );
});

test("second comparison in line 1 is rejected", () => {
  assert.throws(
    () => validateEntry(line1.replace("turns golden brown", "turns golden brown like toast") + "\n" + line2),
    /one analogy/,
  );
});

test("line 2 without naming what is left out is rejected", () => {
  assert.throws(
    () => validateEntry(line1 + "\n" + line2.replace("but it leaves out", "and it forgets")),
    /leaves out/,
  );
});
