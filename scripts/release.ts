import { compare, parse } from "@std/semver";

const configPath = "deno.json";

if (import.meta.main) {
  await release();
}

export interface JsrMetadata {
  latest: string | null;
  versions: Record<string, unknown>;
}

export interface ReleaseState {
  version: string;
  head: string;
  tagTarget?: string;
  tagIsAncestor?: boolean;
  metadata: JsrMetadata;
}

export type ReleaseDecision =
  | { kind: "publish"; createTag: boolean }
  | { kind: "skip" };

export function decideRelease(state: ReleaseState): ReleaseDecision {
  const { version, head, tagTarget, tagIsAncestor, metadata } = state;
  const tag = `v${version}`;

  if (metadata.latest !== null && compare(parse(version), parse(metadata.latest)) < 0) {
    throw new Error(
      `${configPath} version ${version} is below JSR latest ${metadata.latest}`,
    );
  }

  const published = Object.hasOwn(metadata.versions, version);

  if (published) {
    if (tagTarget === head || (tagTarget !== undefined && tagIsAncestor === true)) {
      return { kind: "skip" };
    }

    throw new Error(
      `${version} is published but ${tag} is missing or points outside the current main history`,
    );
  }

  if (tagTarget === undefined) {
    return { kind: "publish", createTag: true };
  }

  if (tagTarget !== head) {
    throw new Error(`${tag} points to another commit`);
  }

  return { kind: "publish", createTag: false };
}

async function release(): Promise<void> {
  const { name, version } = readPackageConfig(await Deno.readTextFile(configPath));
  const tag = `v${version}`;
  await runGit([
    "fetch",
    "origin",
    "+refs/heads/main:refs/remotes/origin/main",
    "--tags",
  ]);
  const [head, mainTarget] = await Promise.all([
    readGitOutput(["rev-parse", "HEAD"]),
    readGitOutput(["rev-parse", "refs/remotes/origin/main"]),
  ]);

  if (head !== mainTarget) {
    console.log(`Skipping stale main commit ${head}. Current main is ${mainTarget}.`);
    return;
  }

  const [metadata, tagTarget] = await Promise.all([
    fetchJsrMetadata(name),
    readTagTarget(tag),
  ]);
  const tagIsAncestor = tagTarget === undefined || tagTarget === head
    ? undefined
    : await isGitAncestor(tagTarget, head);
  const decision = decideRelease({ version, head, tagTarget, tagIsAncestor, metadata });

  if (decision.kind === "skip") {
    console.log(`${name}@${version} is already published; no release needed.`);
    return;
  }

  if (decision.createTag) {
    await runGit(["tag", "-a", tag, "-m", `Release ${tag}`]);
    await runGit(["push", "origin", `refs/tags/${tag}`]);
  }

  await runCommand(Deno.execPath(), ["publish"]);
}

function readPackageConfig(configText: string): { name: string; version: string } {
  const config: unknown = JSON.parse(configText);

  if (
    typeof config !== "object" ||
    config === null ||
    !("name" in config) ||
    typeof config.name !== "string" ||
    !config.name.startsWith("@") ||
    !config.name.includes("/") ||
    !("version" in config) ||
    typeof config.version !== "string"
  ) {
    throw new Error(`${configPath} must contain a scoped package name and string version`);
  }

  parse(config.version);
  return { name: config.name, version: config.version };
}

async function fetchJsrMetadata(name: string): Promise<JsrMetadata> {
  const response = await fetch(`https://jsr.io/${name}/meta.json`, {
    headers: { accept: "application/json" },
    cache: "no-store",
    signal: AbortSignal.timeout(10_000),
  });

  if (!response.ok) {
    throw new Error(`JSR metadata request failed: ${response.status}`);
  }

  const metadata: unknown = await response.json();

  if (
    typeof metadata !== "object" ||
    metadata === null ||
    !("latest" in metadata) ||
    !(metadata.latest === null || typeof metadata.latest === "string") ||
    !("versions" in metadata) ||
    typeof metadata.versions !== "object" ||
    metadata.versions === null
  ) {
    throw new Error("JSR metadata response has an unexpected shape");
  }

  return metadata as JsrMetadata;
}

async function readTagTarget(tag: string): Promise<string | undefined> {
  const command = new Deno.Command("git", {
    args: ["rev-parse", "--verify", "--quiet", `refs/tags/${tag}^{commit}`],
    stdout: "piped",
    stderr: "null",
  });
  const output = await command.output();

  if (output.code === 1) {
    return undefined;
  }

  if (!output.success) {
    throw new Error(`git rev-parse failed with code ${output.code}`);
  }

  return new TextDecoder().decode(output.stdout).trim();
}

async function isGitAncestor(ancestor: string, descendant: string): Promise<boolean> {
  const output = await new Deno.Command("git", {
    args: ["merge-base", "--is-ancestor", ancestor, descendant],
    stdout: "null",
    stderr: "inherit",
  }).output();

  if (output.code === 0) {
    return true;
  }

  if (output.code === 1) {
    return false;
  }

  throw new Error(`git merge-base failed with code ${output.code}`);
}

async function readGitOutput(args: string[]): Promise<string> {
  const command = new Deno.Command("git", {
    args,
    stdout: "piped",
    stderr: "inherit",
  });
  const output = await command.output();

  if (!output.success) {
    throw new Error(`git ${args[0]} failed with code ${output.code}`);
  }

  return new TextDecoder().decode(output.stdout).trim();
}

function runGit(args: string[]): Promise<void> {
  return runCommand("git", args);
}

async function runCommand(command: string, args: string[]): Promise<void> {
  const status = await new Deno.Command(command, {
    args,
    stdin: "null",
    stdout: "inherit",
    stderr: "inherit",
  }).spawn().status;

  if (!status.success) {
    throw new Error(`${command} exited with code ${status.code}`);
  }
}
