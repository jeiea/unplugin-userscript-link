import { expect } from "@std/expect";
import { join, toFileUrl } from "@std/path";
import { build, type OutputChunk } from "rolldown";
import userscriptPlugin from "../src/rolldown.ts";
import { assertDirectoryEquals, mockKy, setup } from "./commons.ts";

Deno.test({
  name: "Given example user script",
  fn: async (test) => {
    const { paths, clear } = await complexSetup("complex");
    const { output, tmpInput, tmpOutput } = paths;

    await Promise.all([
      patchScriptFileUrl({
        example: join(tmpInput, "file/example.user.tsx"),
        library1: join(tmpInput, "file/library1.user.js"),
      }),
      clearBuildDirectory(tmpOutput),
    ]);

    await test.step("when build", async (test) => {
      const { output: built } = await build({
        input: [
          "file/example.user.tsx",
          join(tmpInput, "file/library1.user.js"),
        ],
        plugins: [userscriptPlugin({ syncDirectory: join(tmpOutput, "sync") })],
        output: { format: "cjs" },
      });

      await test.step("build should match expectation", async () => {
        const actualExample = built[0].code.replace(/file:\/\/\S+/, "file://library1.user.js");
        const expectedExample = await Deno.readTextFile(join(output, "build/example.user.js"));

        expect(actualExample).toEqual(expectedExample);

        const actualLibrary1 = (built[1] as OutputChunk).code;
        const expectedLibrary1 = await Deno.readTextFile(join(output, "build/library1.user.js"));

        expect(actualLibrary1).toEqual(expectedLibrary1);
      });

      await test.step({
        name: "sync should match expectation",
        fn: async () => {
          const examplePath = join(tmpOutput, "sync/9e61de4e-18b0-46c6-8656-892faae3815b.user.js");
          const example = await Deno.readTextFile(examplePath);

          // Match with template
          await Deno.writeTextFile(
            examplePath,
            example.replace(/file:\/\/\S+/, "file://library1.user.js"),
          );

          await assertDirectoryEquals(join(output, "sync"), join(tmpOutput, "sync"));
        },
      });
    });

    await clear();
  },
  sanitizeOps: false,
  sanitizeResources: false,
});

async function complexSetup(name: string) {
  const suite = await setup(name);
  const restoreKy = mockKy(join(suite.paths.input, "http"));

  return {
    paths: suite.paths,
    clear: async () => {
      restoreKy();
      await suite.clear();
    },
  };
}

async function patchScriptFileUrl(paths: { example: string; library1: string }) {
  const script1 = await Deno.readTextFile(paths.example);
  const patched = script1.replace("file://library1.user.js", `${toFileUrl(paths.library1)}`);
  await Deno.writeTextFile(paths.example, patched);
}

async function clearBuildDirectory(tmpOutput: string) {
  await Deno.remove(join(tmpOutput, "build"), { recursive: true });
  await Deno.mkdir(join(tmpOutput, "build"), { recursive: true });
}
