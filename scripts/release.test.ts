import { assertEquals, assertThrows } from "@std/assert";
import { decideRelease } from "./release.ts";

const head = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";

Deno.test("decideRelease creates a tag and publishes an unpublished version", () => {
  assertEquals(
    decideRelease({
      version: "0.2.0",
      head,
      metadata: metadata("0.1.1", ["0.1.0", "0.1.1"]),
    }),
    { kind: "publish", createTag: true },
  );
});

Deno.test("decideRelease retries publish when the current commit is already tagged", () => {
  assertEquals(
    decideRelease({
      version: "0.2.0",
      head,
      tagTarget: head,
      metadata: metadata("0.1.1", ["0.1.0", "0.1.1"]),
    }),
    { kind: "publish", createTag: false },
  );
});

Deno.test("decideRelease rejects an unpublished version tagged at another commit", () => {
  assertThrows(
    () =>
      decideRelease({
        version: "0.2.0",
        head,
        tagTarget: "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
        metadata: metadata("0.1.1", ["0.1.0", "0.1.1"]),
      }),
    Error,
    "v0.2.0 points to another commit",
  );
});

Deno.test("decideRelease skips a published version tagged at the current commit", () => {
  assertEquals(
    decideRelease({
      version: "0.2.0",
      head,
      tagTarget: head,
      metadata: metadata("0.2.0", ["0.1.1", "0.2.0"]),
    }),
    { kind: "skip" },
  );
});

Deno.test("decideRelease skips a published version when its tag is an ancestor", () => {
  assertEquals(
    decideRelease({
      version: "0.2.0",
      head,
      tagTarget: "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
      tagIsAncestor: true,
      metadata: metadata("0.2.0", ["0.1.1", "0.2.0"]),
    }),
    { kind: "skip" },
  );
});

Deno.test("decideRelease rejects a published version without a matching tag", () => {
  assertThrows(
    () =>
      decideRelease({
        version: "0.2.0",
        head,
        metadata: metadata("0.2.0", ["0.1.1", "0.2.0"]),
      }),
    Error,
    "0.2.0 is published but v0.2.0 is missing or points outside the current main history",
  );
});

Deno.test("decideRelease rejects a published version tagged at another commit", () => {
  assertThrows(
    () =>
      decideRelease({
        version: "0.2.0",
        head,
        tagTarget: "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
        tagIsAncestor: false,
        metadata: metadata("0.2.0", ["0.1.1", "0.2.0"]),
      }),
    Error,
    "0.2.0 is published but v0.2.0 is missing or points outside the current main history",
  );
});

Deno.test("decideRelease rejects a repository version below the latest stable version", () => {
  assertThrows(
    () =>
      decideRelease({
        version: "0.1.0",
        head,
        metadata: metadata("0.2.0", ["0.1.0", "0.2.0"]),
      }),
    Error,
    "deno.json version 0.1.0 is below JSR latest 0.2.0",
  );
});

function metadata(latest: string, versions: string[]) {
  return {
    latest,
    versions: Object.fromEntries(versions.map((version) => [version, {}])),
  };
}
