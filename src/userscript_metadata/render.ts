import type { Metadata } from "./types.ts";

export function render(metadata: Metadata) {
  return `// ==UserScript==
${[...headerToRows(metadata)].join("")}// ==/UserScript==`;
}

function* headerToRows(header: Metadata) {
  const keys = Object.keys(header);
  const maxKeyLength = Math.max(...keys.map((x) => x.length));
  const entries = Object.entries(header);
  entries.sort(headerKeyComparer);

  for (const [key, values] of entries) {
    for (const value of values) {
      yield `// ${key.padEnd(maxKeyLength)} ${value}\n`;
    }
  }
}

function headerKeyComparer(a: [string, string[]], b: [string, string[]]) {
  const orderA = headerKeyOrder(a[0]);
  const orderB = headerKeyOrder(b[0]);
  return orderA - orderB;
}

function headerKeyOrder(name: string) {
  switch (name) {
    case "@grant":
      return 1;
    case "@require":
      return 2;
    case "@resource":
      return 3;
    default:
      return 0;
  }
}
