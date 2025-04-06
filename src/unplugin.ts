import { createUnplugin, type UnpluginInstance } from "npm:unplugin";
import { unpluginFactory, type UserscriptPluginOptions } from "./unplugin_factory.ts";

/** Unplugin instance for userscripts. */
const plugin: UnpluginInstance<UserscriptPluginOptions | undefined> = createUnplugin(
  unpluginFactory,
);

export default plugin;
