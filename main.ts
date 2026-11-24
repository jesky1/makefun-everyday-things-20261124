import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

// Competition gate: the sealed scorer accepts 1 to 400 characters.
export const MIN_CHARS = 1;
export const MAX_CHARS = 400;

// Two-line explanation of a toaster for a 10-year-old.
// Line 1: one vivid sentence built on a single analogy (a sunbed).
// Line 2: one sentence saying why the analogy works: what it maps
// and what it leaves out.
export const ENTRY =
  "A toaster is a little sunbed for bread: a slice lies down between glowing hot wires, turns golden brown on both sides, and pops up when its tan is done.\n" +
  "The sunbed picture works because both use slow, even heat to brown the outside while the inside stays soft, but it leaves out the timer and the spring that decide when the bread jumps up.";

export function validateEntry(text: string): string {
  const chars = [...text].length;
  if (chars < MIN_CHARS || chars > MAX_CHARS) {
    throw new Error(
      `entry must be ${MIN_CHARS}-${MAX_CHARS} characters, got ${chars}`,
    );
  }
  if (text.trim().length === 0) {
    throw new Error("entry must not be only whitespace");
  }
  if (text !== text.trimEnd()) {
    throw new Error("entry must not end with trailing whitespace");
  }
  if (/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(text)) {
    throw new Error("entry must not contain control characters");
  }
  const lines = text.split("\n");
  if (lines.length !== 2) {
    throw new Error(`entry must be exactly two lines, got ${lines.length}`);
  }
  for (const [i, line] of lines.entries()) {
    if (line.trim().length === 0) {
      throw new Error(`line ${i + 1} must not be empty`);
    }
    if (line !== line.trimEnd()) {
      throw new Error(`line ${i + 1} must not end with trailing whitespace`);
    }
    // Exactly one sentence per line: one terminal period, no other
    // sentence-ending punctuation anywhere in the line.
    const terminators = line.match(/[.!?]/g) ?? [];
    if (terminators.length !== 1 || !line.endsWith(".")) {
      throw new Error(`line ${i + 1} must be exactly one sentence`);
    }
  }
  if (!/toaster/i.test(lines[0])) {
    throw new Error("line 1 must explain a toaster");
  }
  if (!/leaves out/i.test(lines[1])) {
    throw new Error("line 2 must name what the analogy leaves out");
  }
  return text;
}

export function outputDir(): string {
  return process.env.MAKEFUN_OUTPUT_DIR || "/output";
}

export function main(): string {
  const entry = validateEntry(ENTRY);
  const dir = outputDir();
  mkdirSync(dir, { recursive: true });
  const file = join(dir, "entry.txt");
  writeFileSync(file, entry, "utf8");
  return file;
}

main();
