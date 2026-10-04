import ignore, { type Ignore } from "ignore";
import fs from "node:fs";
import path from "node:path";
import { getStateDir } from "../config/paths.js";

/**
 * Files that must never be readable through MCP, regardless of user config.
 * Matched with gitignore semantics against workspace-relative paths.
 */
export const SENSITIVE_PATTERNS: string[] = [
  ".env",
  ".env.*",
  "!.env.example",
  "*.pem",
  "*.key",
  "*.p12",
  "*.pfx",
  "*.jks",
  "*.keystore",
  "id_rsa",
  "id_rsa.*",
  "id_ed25519",
  "id_ed25519.*",
  "id_ecdsa",
  "id_ecdsa.*",
  "id_dsa",
  "id_dsa.*",
  ".ssh/",
  ".aws/",
  ".gnupg/",
  ".npmrc",
  ".netrc",
  "_netrc",
  ".git-credentials",
  "*.keychain",
  "*.keychain-db",
  ".cloudflared/",
  "credentials.json",
  "service-account*.json",
  "secrets.json",
  "cookies.sqlite",
  "Cookies",
  ".c2c-secrets*",
  ...["db", "sqlite", "sqlite3", "session"].flatMap(ext =>
    [`*.${ext}`, `*.${ext}-wal`, `*.${ext}-shm`, `*.${ext}-journal`]),
  "session.json",
  "sessions.json",
  "token.json",
  "tokens.json",
];

/** High-noise directories excluded from listing/search by default. */
export const NOISE_PATTERNS: string[] = [
  ".git/",
  "node_modules/",
  "dist/",
  "build/",
  "out/",
  ".next/",
  ".nuxt/",
  ".svelte-kit/",
  "coverage/",
  ".cache/",
  ".turbo/",
  ".venv/",
  "venv/",
  "__pycache__/",
  ".pytest_cache/",
  ".mypy_cache/",
  "target/",
  ".gradle/",
  ".idea/",
  ".tooling/",
  ".pnpm-store/",
  ".DS_Store",
  "*.lock",
  "pnpm-lock.yaml",
  "package-lock.json",
  "yarn.lock",
];

/** Resolve metadata only, including missing leaves below an existing symlink. */
export function canonicalPath(abs: string): string {
  let current = abs;
  const suffix: string[] = [];
  for (;;) {
    try { return path.join(fs.realpathSync.native(current), ...suffix); } catch {
      const parent = path.dirname(current);
      if (parent === current) return abs;
      suffix.unshift(path.basename(current));
      current = parent;
    }
  }
}

export class IgnoreRules {
  private sensitive: Ignore;
  private noise: Ignore;
  private custom: Ignore;
  private root: string;
  private stateRoot: string;

  constructor(workspaceRoot: string) {
    this.sensitive = ignore().add(SENSITIVE_PATTERNS);
    this.noise = ignore().add(NOISE_PATTERNS);
    this.custom = ignore();
    this.root = canonicalPath(path.resolve(workspaceRoot));
    this.stateRoot = canonicalPath(getStateDir());
    const c2cignore = path.join(this.root, ".c2cignore");
    let exists = false;
    try { fs.lstatSync(c2cignore); exists = true; } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    }
    if (exists) {
      // The policy itself must not import external or protected content. An
      // invalid/unreadable explicit policy fails closed instead of dropping it.
      const target = canonicalPath(c2cignore);
      const rel = path.relative(this.root, target).split(path.sep).join("/");
      if (rel === ".." || rel.startsWith("../") || path.isAbsolute(rel) ||
          this.isSensitive(rel) || !fs.statSync(target).isFile()) {
        throw new Error("Unsafe .c2cignore: policy must be an allowed regular file inside the workspace");
      }
      this.custom.add(fs.readFileSync(target, "utf8"));
    }
  }

  /** True when the path must be denied with ACCESS_DENIED_SENSITIVE_FILE. */
  isSensitive(relPath: string): boolean {
    const candidate = path.resolve(this.root, relPath);
    const normalize = (value: string) => process.platform === "darwin" || process.platform === "win32"
      ? value.toLowerCase() : value;
    const state = normalize(this.stateRoot);
    const absolute = normalize(candidate);
    if (absolute === state || absolute.startsWith(state + path.sep)) return true;
    if (!relPath || relPath === ".") return false;
    return this.sensitive.ignores(relPath) || this.custom.ignores(relPath);
  }

  /** True when the path should be hidden from listing/search (not an error). */
  isNoise(relPath: string): boolean {
    if (!relPath || relPath === ".") return false;
    return this.noise.ignores(relPath);
  }

  isHidden(relPath: string): boolean {
    return this.isSensitive(relPath) || this.isNoise(relPath);
  }
}
