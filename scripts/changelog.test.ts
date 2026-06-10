import { assertEquals, assertThrows } from "@std/assert";
import {
  assertChangelogCurrent,
  readCurrentVersion,
  readLatestChangelogVersion,
} from "./changelog.ts";

Deno.test("readCurrentVersion reads the package version from JSON", () => {
  const config = `{
    "version": "1.2.3"
  }`;

  assertEquals(readCurrentVersion(config), "1.2.3");
});

Deno.test("readLatestChangelogVersion reads the first released version", () => {
  const changelog = `# Changelog

## [1.2.3] - 2026-06-10

### Added

- A feature

## [1.2.2] - 2026-06-01
`;

  assertEquals(readLatestChangelogVersion(changelog), "1.2.3");
});

Deno.test("assertChangelogCurrent rejects a stale changelog", () => {
  assertThrows(
    () =>
      assertChangelogCurrent(
        '{ "version": "1.2.3" }',
        "## [1.2.2] - 2026-06-01",
      ),
    Error,
    "CHANGELOG.md latest version 1.2.2 does not match deno.json version 1.2.3",
  );
});
