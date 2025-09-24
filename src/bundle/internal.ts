import { type Metadata, render } from "@jeiea/userscript-metadata";

export const mainModuleKey = "main";
export const grantsModuleKey = "tampermonkey_grants";

export function renderBundleHeader(metadata: Metadata): string {
  return `${render(metadata)}\n"use strict";\n`;
}

export function renderHeaderScript(headers: Metadata) {
  if (isLibraryHeader(headers)) {
    return "";
  }

  if (!hasLinkResource(headers)) {
    return "";
  }
  return `define("${mainModuleKey}", (require, exports, module) => {`;
}

export function renderFooterScript(header: Metadata) {
  if (isLibraryHeader(header) || !hasLinkResource(header)) {
    return "";
  }

  return `});
${renderGrantModuleDefinition(header)}
load()

async function load() {
  const links = GM.info.script.resources.filter(x => x.name.startsWith("link:"));
  await Promise.all(links.map(async ({ name }) => {
    const script = await GM.getResourceText(name)
    define(name.replace("link:", ""), Function("require", "exports", "module", script))
  }));
  require(["${mainModuleKey}"], () => {}, console.error);
}`;
}

export function isLibraryHeader(mainHeader: Metadata) {
  const requireJs = /\/require.js\b/;
  return mainHeader["@require"]?.every((x) => !x.match(requireJs)) ?? true;
}

export function getLinkResourceKeys(header: Metadata) {
  return header["@resource"]?.flatMap((x) => {
    const key = x.split(/\s+/)?.[0];
    return key?.startsWith("link:") ? [key] : [];
  }) ?? [];
}

function renderGrantModuleDefinition(header: Metadata) {
  const grants = header["@grant"] ?? [];
  if (!grants.length) {
    return "";
  }

  const grantIds = grants.filter((x) => !x.includes("."));
  if (grants.some((x) => /^GM[_.]/.test(x))) {
    grantIds.unshift("GM");
  }
  return `\ndefine("${grantsModuleKey}", function() { Object.assign(this.window, { ${
    grantIds.join(", ")
  } }); });
requirejs.config({ deps: ["tampermonkey_grants"] });`;
}

function hasLinkResource(header: Metadata) {
  return header["@resource"]?.some((x) => x.startsWith("link:"));
}
