import { assertEquals } from "@std/assert/equals";
import { merge } from "./mod.ts";

Deno.test("Given userscript header merger", async (test) => {
  await test.step("when merge two empties", async (test) => {
    const merged = merge({}, {});

    await test.step("it should return empty", () => {
      assertEquals(merged, {});
    });
  });

  await test.step("when merge a header having name and an empty", async (test) => {
    const merged = merge({ "@name": ["main userscript"] }, {});

    await test.step("it should return name", () => {
      assertEquals(merged, { "@name": ["main userscript"] });
    });
  });

  await test.step("when merge two headers having name", async (test) => {
    const merged = merge({ "@name": ["main userscript"] }, {
      name: ["sub userscript"],
    });

    await test.step("it should return first name", () => {
      assertEquals(merged, { "@name": ["main userscript"] });
    });
  });

  await test.step("when merge two headers having resource", async (test) => {
    const merged = merge({
      "@resource": [
        "react https://cdn.jsdelivr.net/npm/react@18.2.0/cjs/react.production.min.js",
      ],
    }, {
      "@resource": [
        "react-dom https://cdn.jsdelivr.net/npm/react-dom@18.2.0/cjs/react-dom.production.min.js",
      ],
    });

    await test.step("it should align column and return all resources", () => {
      assertEquals(merged, {
        "@resource": [
          "react     https://cdn.jsdelivr.net/npm/react@18.2.0/cjs/react.production.min.js",
          "react-dom https://cdn.jsdelivr.net/npm/react-dom@18.2.0/cjs/react-dom.production.min.js",
        ],
      });
    });
  });

  await test.step("when merge two headers having same grants", async (test) => {
    const merged = merge(
      { "@grant": ["GM_getValue"] },
      { "@grant": ["GM_getValue"] },
    );

    await test.step("it should return one grants", () => {
      assertEquals(merged, { "@grant": ["GM_getValue"] });
    });
  });
});
