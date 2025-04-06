import type { RolldownPluginOption } from "npm:rolldown";
import { createRolldownPlugin } from "npm:unplugin";
import { unpluginFactory, type UserscriptPluginOptions } from "./unplugin_factory.ts";

const plugin: (options?: UserscriptPluginOptions) => RolldownPluginOption = createRolldownPlugin(
  unpluginFactory,
);

export default plugin;
