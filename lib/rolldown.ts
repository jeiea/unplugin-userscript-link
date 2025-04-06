import { createRolldownPlugin } from "npm:unplugin/rolldown";
import { unpluginFactory } from "./unplugin_factory.ts";

export type { UserscriptPluginOptions } from "./unplugin_factory.ts";

export default createRolldownPlugin(unpluginFactory);
