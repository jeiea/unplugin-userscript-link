import type { Metadata } from "./types.ts";

export function extract(code: string): Metadata | undefined {
  const header = code.match(
    /(?:^\/\/ ==UserScript==\r?\n)(?:\/\/.*\r?\n)+\/\/ ==\/UserScript==$/m,
  )?.[0];
  if (!header) {
    return;
  }

  const matches = header.matchAll(/^\s*\/\/\s*(@\S+)\s+(.+)/gm);
  const record: Record<string, string[]> = {};
  for (const [, key, value] of matches) {
    if (record![key!]) {
      record[key!]!.push(value!);
    } else {
      record[key!] = [value!];
    }
  }

  return record;
}
