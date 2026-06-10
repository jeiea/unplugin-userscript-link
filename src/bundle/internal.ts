import { type Metadata, render } from "@jeiea/userscript-metadata";

export const mainModuleKey = "main";

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

load()

async function load() {
  const links = GM.info.script.resources.filter(x => x.name.startsWith("link:"));
  await Promise.all(links.map(async ({ name }) => {
    const script = await GM.getResourceText(name)
    ${renderLinkModuleDefinition(header)}
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

function renderLinkModuleDefinition(header: Metadata) {
  const grantIds = getGrantIds(header);
  if (!grantIds.length) {
    return `define(name.replace("link:", ""), Function("require", "exports", "module", script))`;
  }

  const parameterNames = grantIds.map((id) => JSON.stringify(id)).join(", ");
  const grantValues = grantIds.join(", ");
  return `const createModule = Function(${parameterNames}, "return function(require, exports, module) {\\n" + script + "\\n}")
    define(name.replace("link:", ""), createModule(${grantValues}))`;
}

function getGrantIds(header: Metadata) {
  const grants = header["@grant"] ?? [];
  const grantIds = grants.filter((grant) =>
    grant !== "none" && /^[$_\p{ID_Start}][$\p{ID_Continue}]*$/u.test(grant)
  );
  if (grants.some((grant) => /^GM[_.]/.test(grant))) {
    grantIds.unshift("GM");
  }
  return [...new Set(grantIds)];
}

function hasLinkResource(header: Metadata) {
  return header["@resource"]?.some((x) => x.startsWith("link:"));
}
