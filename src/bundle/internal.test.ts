import { assertEquals } from "jsr:@std/assert/equals";
import { renderBundleHeader, renderFooterScript, renderHeaderScript } from "./internal.ts";

Deno.test("Given userscript header renderer", async (test) => {
  const render = renderBundleHeader;

  await test.step("when input empty header", async (test) => {
    const rendered = render({});

    await test.step("it should return empty header", () => {
      assertEquals(
        rendered,
        `// ==UserScript==
// ==/UserScript==
"use strict";\n`,
      );
    });
  });

  await test.step("when input header having different key length", async (test) => {
    const rendered = render({
      "@name": ["main userscript"],
      "@description": ["for test"],
    });

    await test.step("it should align column", () => {
      assertEquals(
        rendered,
        `// ==UserScript==
// @name        main userscript
// @description for test
// ==/UserScript==
"use strict";\n`,
      );
    });
  });
});

Deno.test("Given requirejs script header renderer", async (test) => {
  const render = renderHeaderScript;

  await test.step("when input empty header", async (test) => {
    const rendered = render({});

    await test.step("it should return empty", () => {
      assertEquals(rendered, "");
    });
  });

  await test.step("when input library header", async (test) => {
    const rendered = render({
      "@resource": ["react https://cdn.jsdelivr.net/npm/react"],
      "@grant": ["GM_setValue", "window.close"],
    });

    await test.step("it should return empty", () => {
      assertEquals(rendered, "");
    });
  });

  await test.step("when input application header with no dependency", async (test) => {
    const rendered = render({
      "@require": ["https://cdn.jsdelivr.net/npm/requirejs@2.3.6/require.js"],
      "@resource": ["react https://cdn.jsdelivr.net/npm/react"],
      "@grant": ["GM_setValue"],
    });

    await test.step("it should return empty", () => {
      assertEquals(rendered, "");
    });
  });

  await test.step("when input application header with dependency", async (test) => {
    const rendered = render({
      "@require": ["https://cdn.jsdelivr.net/npm/requirejs@2.3.6/require.js"],
      "@resource": ["link:react https://cdn.jsdelivr.net/npm/react"],
    });

    await test.step("it should return define snippet", () => {
      assertEquals(
        rendered,
        `define("main", (require, exports, module) => {`,
      );
    });
  });
});

Deno.test("Given requirejs script footer renderer", async (test) => {
  const render = renderFooterScript;

  await test.step("when input empty header", async (test) => {
    const rendered = render({});

    await test.step("it should return empty", () => {
      assertEquals(rendered, "");
    });
  });

  await test.step("when input application header with no dependency", async (test) => {
    const rendered = render({
      "@require": ["https://cdn.jsdelivr.net/npm/requirejs@2.3.6/require.js"],
      "@resource": ["react https://cdn.jsdelivr.net/npm/react"],
      "@grant": ["GM_setValue"],
    });

    await test.step("it should return empty", () => {
      assertEquals(rendered, "");
    });
  });

  await test.step("when input application header having a dependency", async (test) => {
    const rendered = render({
      "@require": ["https://cdn.jsdelivr.net/npm/requirejs@2.3.6/require.js"],
      "@resource": ["link:react https://cdn.jsdelivr.net/npm/react"],
    });

    await test.step("it should import it", () => {
      assertEquals(
        rendered,
        `});

load()

async function load() {
  const links = GM.info.script.resources.filter(x => x.name.startsWith("link:"));
  await Promise.all(links.map(async ({ name }) => {
    const script = await GM.getResourceText(name)
    define(name.replace("link:", ""), Function("require", "exports", "module", script))
  }));
  require(["main"], () => {}, console.error);
}`,
      );
    });
  });

  await test.step("when input application header having grant and dependency", async (test) => {
    const rendered = render({
      "@require": ["https://cdn.jsdelivr.net/npm/requirejs@2.3.6/require.js"],
      "@resource": ["link:react https://cdn.jsdelivr.net/npm/react"],
      "@grant": ["GM.setValue"],
    });

    await test.step("it should import it", () => {
      assertEquals(
        rendered,
        `});

define("tampermonkey_grants", function() { Object.assign(this.window, { GM }); });
requirejs.config({ deps: ["tampermonkey_grants"] });
load()

async function load() {
  const links = GM.info.script.resources.filter(x => x.name.startsWith("link:"));
  await Promise.all(links.map(async ({ name }) => {
    const script = await GM.getResourceText(name)
    define(name.replace("link:", ""), Function("require", "exports", "module", script))
  }));
  require(["main"], () => {}, console.error);
}`,
      );
    });
  });
});
