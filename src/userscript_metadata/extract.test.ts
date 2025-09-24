import { assertEquals } from "@std/assert/equals";
import { extract } from "./extract.ts";

Deno.test("extracting simple metadata block", () => {
  const metadata = extract(`
// ==UserScript==
// @key value
// ==/UserScript==`);
  assertEquals(metadata, { "@key": ["value"] });
});

Deno.test("extracting value with space", () => {
  const metadata = extract(`// ==UserScript==
// @name main userscript
// ==/UserScript==
`);

  assertEquals(metadata, { "@name": ["main userscript"] });
});

Deno.test("extracting duplicate keys", () => {
  const metadata = extract(`
// ==UserScript==
// @key value
// @key value
// ==/UserScript==
  `);
  assertEquals(metadata, { "@key": ["value", "value"] });
});

Deno.test("extracting multiple keys", () => {
  const metadata = extract(`
// ==UserScript==
// @key value
// @key2 value2
// ==/UserScript==
  `);
  assertEquals(metadata, { "@key": ["value"], "@key2": ["value2"] });
});

Deno.test("rejecting leading space", () => {
  const metadata = extract(`
 // ==UserScript==
// @key value
// ==/UserScript==
  `);
  assertEquals(metadata, undefined);
});

Deno.test("ignoring keys missing @", () => {
  const metadata = extract(`
// ==UserScript==
// key value
// ==/UserScript==
  `);
  assertEquals(metadata, {});
});
