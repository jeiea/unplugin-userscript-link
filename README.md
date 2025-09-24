# unplugin-userscript-link

Bundle userscript with deno while leaving aside dependencies at @resource.

Only supports rolldown for now.

## Usage (deno, rolldown)

```ts
import userscriptLink from "jsr:@jeiea/unplugin-userscript-link/rolldown";
import { defineConfig } from "rolldown";

const plugins = [
  userscriptLink({ syncDirectory: Deno.env.get("OUTPUT_SYNC") }),
  // If you want to use https imports,
  (await import("@deno/vite-plugin")).default(),
];
export default defineConfig([
  { input: "some-script-1.user.ts", plugins },
  { input: "some-script-2.user.ts", plugins },
]);
```

## Contributing

For now it's for personal usage, opinions are welcome.
