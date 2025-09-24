/**
 * Rolldown plugin for userscripts. See readme for details.
 */

import type { RolldownPluginOption } from "rolldown";
import { createRolldownPlugin } from "unplugin";
import { unpluginFactory, type UserscriptPluginOptions } from "./unplugin_factory.ts";

/** Rolldown plugin for userscripts. */
const plugin: (options?: UserscriptPluginOptions) => RolldownPluginOption = createRolldownPlugin(
  unpluginFactory,
);

export default plugin;
