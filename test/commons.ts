import { assertEquals } from "@std/assert/equals";
import { copy } from "@std/fs/copy";
import { dirname, fromFileUrl, join, resolve } from "@std/path";
import { FakeTime } from "@std/testing/time";
import { _internals } from "../src/collect_userscript_headers.ts";

export const dataDirectory = resolve(dirname(fromFileUrl(import.meta.url)), "data");

export async function setup(projectName: string) {
  const time = new FakeTime("2023-09-01T01:02:03Z");
  const cwd = Deno.cwd();

  const tmp = await Deno.makeTempDir({ prefix: projectName });
  const project = join(dataDirectory, projectName);
  const paths = {
    input: join(project, "input"),
    output: join(project, "output"),
    tmp,
    tmpInput: join(tmp, "input"),
    tmpOutput: join(tmp, "output"),
  };

  await copy(project, tmp, { overwrite: true });
  Deno.chdir(paths.tmpInput);

  return {
    time,
    paths,
    clear: async () => {
      Deno.chdir(cwd);
      time.restore();
      await Deno.remove(paths.tmp, { recursive: true });
    },
  };
}

export function mockFetch(httpRoot: string) {
  const originalFetchText = _internals.fetchText;
  _internals.fetchText = async (url) => {
    if (url.startsWith("http://localhost:8080/")) {
      const relative = new URL(url).pathname;
      const absolute = join(httpRoot, relative);
      return await Deno.readTextFile(absolute);
    }
    return '"mocked"';
  };

  return function restoreFetch() {
    _internals.fetchText = originalFetchText;
  };
}

export async function assertDirectoryEquals(actual: string, expected: string) {
  const [actualFiles, expectedFiles] = await Promise.all([
    snapshotDirectory(actual),
    snapshotDirectory(expected),
  ]);
  assertEquals(actualFiles, expectedFiles);
}

// It returns name and file content recursively.
async function snapshotDirectory(directory: string) {
  const result = new Map<string, string>();

  const promises = [];
  for await (const file of Deno.readDir(directory)) {
    promises.push(insert(file));
  }
  await Promise.all(promises);

  return result;

  async function insert(file: Deno.DirEntry) {
    const path = join(directory, file.name);
    if (file.isDirectory) {
      const subResult = await snapshotDirectory(path);
      for (const [name, content] of subResult) {
        result.set(join(file.name, name), content);
      }
    } else {
      result.set(file.name, await Deno.readTextFile(path));
    }
  }
}
