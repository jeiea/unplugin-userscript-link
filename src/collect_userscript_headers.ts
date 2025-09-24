import { fromFileUrl } from "@std/path/from-file-url";
import { resolve } from "@std/path/resolve";
import ky from "ky";
import { extract, type Metadata } from "@jeiea/userscript-metadata";

const cache = new Map<string, Response>();
export const _internals = {
  ky: ky.create({
    hooks: {
      beforeRequest: [(request) => {
        return cache.get(request.url)?.clone();
      }],
    },
  }),
};

export async function collectUserscriptHeaders(
  id: string,
  url: string,
): Promise<Record<string, Metadata>> {
  const js = await readOrFetch(url);
  if (!js) {
    console.warn(`Cannot get ${url}`);
    return {};
  }

  const header = extract(js);
  if (!header) {
    return {};
  }

  const resources = header["@resource"] ?? [];
  const pairs = resources.flatMap(getLinkResource);

  const headers = await Promise.all(
    pairs.map(({ key, url }) => collectUserscriptHeaders(key, url)),
  );
  const merged = Object.assign({ [id]: header }, ...headers);
  return merged;
}

async function readOrFetch(id: string) {
  const { type, path } = getSourceKey(id);
  switch (type) {
    case "file":
      try {
        return await Deno.readTextFile(path);
      } catch (error) {
        if (error instanceof Deno.errors.NotFound) {
          return null;
        }
        throw error;
      }
    case "url": {
      return await _internals.ky.get(id).text();
    }
  }
}

function getLinkResource(resource: string) {
  const [key, url] = resource.split(/\s+/);
  const isLinkResource = key && url && key.startsWith("link:");
  return isLinkResource ? [{ key, url }] : [];
}

function getSourceKey(path: string): { type: "url" | "file"; path: string } {
  if (path.startsWith("http") || path.startsWith("data:")) {
    return { type: "url", path };
  }

  const relative = path.startsWith("file:") ? fromFileUrl(path) : path;
  const absolute = resolve(relative);
  return { type: "file", path: absolute };
}
