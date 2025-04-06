import type { RolldownPluginOption } from "npm:rolldown";
import { createRolldownPlugin } from "npm:unplugin";
import { unpluginFactory, type UserscriptPluginOptions } from "./unplugin_factory.ts";

/** Rolldown plugin for userscripts. */
const plugin: (options?: UserscriptPluginOptions) => RolldownPluginOption = createRolldownPlugin(
  unpluginFactory,
);

export default plugin;
