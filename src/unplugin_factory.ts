import { resolve } from "jsr:@std/path@^1/resolve";
import type { OutputAsset, OutputChunk, RolldownPlugin } from "npm:rolldown";
import type { UnpluginFactory } from "npm:unplugin";
import { mainModuleKey } from "./bundle/internal.ts";
import { bundle as bundleUserscript, getLinkResourceKeys } from "./bundle/mod.ts";
import { collectUserscriptHeaders } from "./collect_userscript_headers.ts";
import { SyncMap } from "./sync_map.ts";
import type { Metadata } from "./userscript_metadata/types.ts";

/** Options for the userscript plugin. */
export type UserscriptPluginOptions = {
  /**
   * [TamperDAV](https://github.com/Tampermonkey/tamperdav) sync directory for applying scripts to tampermonkey instantly.
   *
   * Outputs will be written to the directory as well.
   */
  syncDirectory?: string;
};

type HeadersMap = Record<string, Metadata>;

export function unpluginFactory(
  options?: UserscriptPluginOptions,
): ReturnType<UnpluginFactory<UserscriptPluginOptions>> {
  const externalModules = new Set<string>();
  let syncMap: SyncMap | null = null;
  let resolutionPromise: Promise<unknown> = Promise.resolve();
  const entryToHeadersMap = new Map<string, Promise<HeadersMap>>();

  return {
    name: "unplugin-userscript-link",
    async buildStart() {
      entryToHeadersMap.clear();

      if (options?.syncDirectory) {
        syncMap = await new SyncMap(options.syncDirectory).load();
      }
    },

    async resolveId(id, _, { isEntry }) {
      if (isEntry) {
        resolutionPromise = Promise.all([resolutionPromise, collectExternals(id)]);
      }
      await resolutionPromise;

      return externalModules.has(id) ? { id, external: true } : null;
    },

    rolldown: {
      async generateBundle(_options, bundle) {
        const chunks = Object.values(bundle).filter(isUserscriptChunk);
        if (chunks.length === 0) {
          this.warn("No userscript chunks found.");
          return;
        }

        for (const chunk of chunks) {
          const { facadeModuleId } = chunk;
          if (!facadeModuleId) {
            throw new Error(`Chunk ${chunk.fileName} has no facade module id.`);
          }

          const header = await entryToHeadersMap.get(facadeModuleId);
          if (!header) {
            throw new Error(
              `Headers map for ${chunk.fileName} is not found.\n` +
                `ID: ${facadeModuleId}\n` +
                `Keys: ${Array.from(entryToHeadersMap.keys()).join(",")}`,
            );
          }

          chunk.code = bundleUserscript(chunk.code, header);

          if (syncMap) {
            const mainHeader = header[mainModuleKey];
            if (!mainHeader) {
              throw new Error("Main module header not found.");
            }

            const sync = syncMap.getOrCreate(mainHeader);
            if (sync) {
              this.emitFile({
                fileName: sync.path,
                type: "asset",
                source: chunk.code,
              });
              this.info(`[${new Date().toISOString()}] Sync to ${sync.path}`);
            }
          }
          this.info(`[${new Date().toISOString()}] Processed ${chunk.fileName}`);
        }
      },
    } satisfies Partial<RolldownPlugin>,
  };

  async function collectExternals(id: string) {
    const inspectionPromise = collectUserscriptHeaders(mainModuleKey, id);
    entryToHeadersMap.set(resolve(id), inspectionPromise);
    const headerMap = await inspectionPromise;

    const resources = Object.values(headerMap).flatMap(getLinkResourceKeys);
    const modules = resources.map((x) => x.slice("link:".length));
    for (const module of modules) {
      externalModules.add(module);
    }
  }
}

function isUserscriptChunk(bundle: OutputAsset | OutputChunk): bundle is OutputChunk {
  return bundle.type === "chunk" && bundle.fileName.endsWith(".user.js");
}
