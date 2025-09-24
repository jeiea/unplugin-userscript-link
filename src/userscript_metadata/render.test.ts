import { assertEquals } from "@std/assert/equals";
import { render } from "./render.ts";

Deno.test("render simple metadata", () => {
  const metadata = { "@key": ["value"] };

  const result = render(metadata);
  assertEquals(
    result,
    "// ==UserScript==\n// @key value\n// ==/UserScript==",
  );
});

Deno.test("render multiple keys with align", () => {
  const metadata = { "@key": ["value"], "@key2": ["value2"] };

  const result = render(metadata);
  assertEquals(
    result,
    `// ==UserScript==
// @key  value
// @key2 value2
// ==/UserScript==`,
  );
});

Deno.test("sort special keys", () => {
  const metadata = {
    "@resource": ["b"],
    "@require": ["a"],
    "@grant": ["GM_getValue"],
  };

  const result = render(metadata);
  assertEquals(
    result,
    `// ==UserScript==
// @grant    GM_getValue
// @require  a
// @resource b
// ==/UserScript==`,
  );
});
