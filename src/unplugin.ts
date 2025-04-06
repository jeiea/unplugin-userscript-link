import { createUnplugin, type UnpluginInstance } from "npm:unplugin";
import { unpluginFactory, type UserscriptPluginOptions } from "./unplugin_factory.ts";

export default createUnplugin(unpluginFactory) as UnpluginInstance<
  UserscriptPluginOptions | undefined
>;
