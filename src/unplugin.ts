/**
 * Unplugin for userscripts.
 *
 * It's not usable for other bundlers except rolldown, just for plugin convention.
 */

import { createUnplugin, type UnpluginInstance } from "unplugin";
import { unpluginFactory, type UserscriptPluginOptions } from "./unplugin_factory.ts";

/** Unplugin instance for userscripts. */
const plugin: UnpluginInstance<UserscriptPluginOptions | undefined> = createUnplugin(
  unpluginFactory,
);

export default plugin;
