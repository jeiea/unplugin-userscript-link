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

### Release

Install `git-cliff` 2.13.0, update the version in `deno.json`, and generate the changelog:

```sh
deno task changelog
```

Commit the version and changelog together, then verify the clean release commit:

```sh
deno task ci
```

Push the commit to `main`. After the checks pass, GitHub Actions compares the version with JSR,
creates the matching Git tag, and publishes only when that exact version is not already published.
Later commits with the same version are skipped until `deno.json` is updated for the next release.
