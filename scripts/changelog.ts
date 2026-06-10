const configPath = "deno.json";
const changelogPath = "CHANGELOG.md";

if (import.meta.main) {
  await main(Deno.args);
}

export function readCurrentVersion(configText: string): string {
  const config: unknown = JSON.parse(configText);

  if (
    typeof config !== "object" ||
    config === null ||
    !("version" in config) ||
    typeof config.version !== "string"
  ) {
    throw new Error(`${configPath} must contain a string version`);
  }

  return config.version;
}

export function readLatestChangelogVersion(changelogText: string): string | undefined {
  return /^## \[([^\]]+)\](?: - .+)?$/m.exec(changelogText)?.[1];
}

export function assertChangelogCurrent(configText: string, changelogText: string): void {
  const currentVersion = readCurrentVersion(configText);
  const changelogVersion = readLatestChangelogVersion(changelogText);

  if (changelogVersion !== currentVersion) {
    throw new Error(
      `${changelogPath} latest version ${
        changelogVersion ?? "(missing)"
      } does not match ${configPath} version ${currentVersion}`,
    );
  }
}

async function main(args: string[]): Promise<void> {
  const configText = await Deno.readTextFile(configPath);

  if (args.length === 0) {
    await generateChangelog(readCurrentVersion(configText));
    return;
  }

  if (args.length === 1 && args[0] === "--check") {
    assertChangelogCurrent(configText, await Deno.readTextFile(changelogPath));
    return;
  }

  if (args.length === 1 && args[0] === "--version") {
    console.log(readCurrentVersion(configText));
    return;
  }

  throw new Error("Usage: changelog.ts [--check | --version]");
}

async function generateChangelog(version: string): Promise<void> {
  const command = new Deno.Command("git-cliff", {
    args: ["--tag", `v${version}`, "--output", changelogPath],
    stdin: "null",
    stdout: "inherit",
    stderr: "inherit",
  });
  const status = await command.spawn().status;

  if (!status.success) {
    throw new Error(`git-cliff exited with code ${status.code}`);
  }
}
