import { createUnplugin } from "npm:unplugin";
import { unpluginFactory } from "./unplugin_factory.ts";
export type { UserscriptPluginOptions } from "./unplugin_factory.ts";

export default createUnplugin(unpluginFactory);
