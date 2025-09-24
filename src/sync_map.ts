import { basename } from "@std/path/basename";
import { join } from "@std/path/join";
import { resolve } from "@std/path/resolve";
import { extract } from "./userscript_metadata/extract.ts";
import type { Metadata } from "./userscript_metadata/types.ts";

/** @internal */
export type PathMap = Map<string | null, Map<string, { path: string; metaPath: string }>>;

export class SyncMap {
  #directory: string;
  #namespaces = new Map() as PathMap;

  constructor(tamperDavPath: string) {
    this.#directory = tamperDavPath;
  }

  load = async () => {
    this.#namespaces = await getUserscriptMap(this.#directory);
    return this;
  };

  getOrCreate = (metadata: Metadata) => {
    return getOrCreate(this.#namespaces, { metadata, directory: this.#directory });
  };
}

/** @returns Map of namespace to map of name to path */
export async function getUserscriptMap(path: string) {
  const paths = new Map() as PathMap;

  for await (const file of Deno.readDir(path)) {
    if (!file.isFile || !file.name.endsWith(".meta.json")) {
      continue;
    }

    const metaPath = resolve(path, file.name);
    const json = await Deno.readTextFile(metaPath);
    const meta = JSON.parse(json);
    if (meta?.options?.removed) {
      continue;
    }

    const scriptPath = resolve(path, meta.uuid.replace(/$/, ".user.js"));
    let script = "";
    try {
      script = await Deno.readTextFile(scriptPath);
    } catch (error) {
      if (error instanceof Deno.errors.NotFound) {
        continue;
      }
    }

    const header = extract(script);
    const name = header?.["@name"]?.[0];
    if (!name) {
      continue;
    }

    const namespaceMap = getOrCreateNamespaceMap(paths, header);
    if (namespaceMap.has(name)) {
      throw new Error(`Duplicate userscript name: ${name}`);
    }

    namespaceMap.set(name, {
      path: scriptPath,
      metaPath,
    });
  }

  return paths;
}

export function getOrCreate(
  pathMap: PathMap,
  { metadata, directory }: { metadata: Metadata; directory: string },
) {
  const name = metadata["@name"]?.[0];
  if (!name) {
    return null;
  }

  const namespaceMap = getOrCreateNamespaceMap(pathMap, metadata);
  return namespaceMap?.get(name) ?? (() => {
    const uuid = crypto.randomUUID();
    const item = {
      path: join(directory, `${uuid}.user.js`),
      metaPath: join(directory, `${uuid}.meta.json`),
    };
    namespaceMap.set(name, item);
    return item;
  })();
}

// If user removed userscript, tampermonkey add options.removed: Date.now() into meta.json.
// So it overwrite meta.json always to reset this.
export async function writeMetaJson(metaPath: string, name: string) {
  try {
    const json = await Deno.readTextFile(metaPath);
    const meta = JSON.parse(json);
    meta.lastModified = Date.now();
    await Deno.writeTextFile(metaPath, JSON.stringify(meta));
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) {
      await Deno.writeTextFile(
        metaPath,
        JSON.stringify({
          uuid: basename(metaPath, ".meta.json"),
          name,
          options: {},
          lastModified: Date.now(),
        }),
      );
    }
  }
}

function getOrCreateNamespaceMap(namespaces: PathMap, metadata: Metadata) {
  const namespace = metadata["@namespace"]?.[0] ?? null;
  return namespaces.get(namespace) ?? (() => {
    const map = new Map<string, { path: string; metaPath: string }>();
    namespaces.set(namespace, map);
    return map;
  })();
}
