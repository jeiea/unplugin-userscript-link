import type { Metadata } from "../userscript_metadata/types.ts";
import {
  isLibraryHeader,
  mainModuleKey,
  renderBundleHeader,
  renderFooterScript,
  renderHeaderScript,
} from "./internal.ts";
export { getLinkResourceKeys } from "./internal.ts";

export function bundle(script: string, headers: Record<string, Metadata>): string {
  const { [mainModuleKey]: mainHeader, ...subHeaders } = headers;
  if (!mainHeader) {
    throw new Error("main header not found");
  }

  const isLib = isLibraryHeader(mainHeader);
  const mergedHeader = Object.values(subHeaders).reduce(
    merge,
    mainHeader,
  );
  const finalHeader = replaceDateVersion(
    isLib ? mergedHeader : insertRequireJsRequirements(mergedHeader),
  );

  const parts = [
    renderBundleHeader(finalHeader),
    renderHeaderScript(finalHeader),
    removeComment(script),
    renderFooterScript(finalHeader),
  ];

  return `${parts.filter(Boolean).join("\n").trim()}\n`;
}

export function merge(main: Metadata, sub: Metadata): Metadata {
  const grantKey = "@grant";
  const grants = mergeAndSort(main[grantKey], sub[grantKey]);

  const requireKey = "@require";
  const requires = mergeAndSort(main[requireKey], sub[requireKey]);

  const resourceKey = "@resource";
  const resourceTable = [
    ...(main[resourceKey] ?? []).map((x) => x.split(/\s+/)),
    ...(sub[resourceKey] ?? []).map((x) => x.split(/\s+/)),
  ];
  const maxKeyLength = Math.max(
    ...resourceTable.map((x) => x[0]?.length ?? -Infinity),
  );
  const rows = resourceTable.map((x) => `${x[0]?.padEnd(maxKeyLength)} ${x.slice(1)}`);
  const resources = mergeAndSort(rows, []);

  return {
    ...main,
    ...(requires.length ? { [requireKey]: requires } : {}),
    ...(grants.length ? { [grantKey]: grants } : {}),
    ...(resources.length ? { [resourceKey]: resources } : {}),
  };
}

function mergeAndSort(a?: string[], b?: string[]) {
  return [...new Set([...a ?? [], ...b ?? []])].sort();
}

function insertRequireJsRequirements(header: Metadata) {
  return merge(header, { "@grant": ["GM.getResourceText"] });
}

function removeComment(code: string) {
  // https://regex101.com/r/HpyogW/1
  const commentStripped = code.replace(
    /(`[\s\S]*?`|"(?<!\\")(?:[^"\n\\]|\\.)*?")|\/\*[\s\S]*?\*\/|^\s*?\/\/.*\n|\/(?<!\\\/)\/.*/gm,
    "$1",
  );
  const functionStrictStripped = commentStripped.replace(/^\s*?["']use strict["'];\s*/m, "");
  return functionStrictStripped;
}

function replaceDateVersion(header: Metadata) {
  const version = header["@version"]?.[0];
  if (!version?.includes("{date_version}")) {
    return header;
  }

  const dateVersion = new Date().toISOString().replace(/\D+/g, "").slice(
    2,
    14,
  );
  return {
    ...header,
    "@version": [version.replace("{date_version}", dateVersion)],
  };
}
