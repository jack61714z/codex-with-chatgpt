# Codex with ChatGPT

> Chat investigates, plans and reviews; Codex.app is the daily single repository writer.
> 共同分工以 [collaboration policy](skill/references/collaboration-policy.md) 为准。

> [!IMPORTANT]
> Diagnose the actual connection/load failure before updating. Preserve local policy customizations and platform safety holds; see [maintenance](skill/references/maintenance.md).

## The problem · 解决什么问题

**中文** — ChatGPT 付费订阅的网页版额度大量闲置，Codex 却在消耗紧张的
API 额度做规划和 Review。本项目把"思考"交给你已付费的网页版 ChatGPT，
Codex.app 是日常 repo 唯一 writer；Chat 負責調查、規劃與審查。不用 API Key、不搞逆向代理——官方网页 + 只读 MCP 桥接。

**EN** — ChatGPT Plus/Pro web quota sits idle while your coding agent burns
scarce API/Codex tokens on planning and review. This project moves the
investigation, planning and review to Chat; Codex.app is the daily single repository writer.
No API keys, no reverse proxy — official web UI plus a read-only MCP bridge.

## What it is · 这是什么

**中文** — C2C 提供安全的只读 workspace 连接与小型控制讯息。它不会把 Chat 固定成唯读角色；其他已授权 GitHub/RDC 能力仍按共同政策使用。

**EN** — C2C supplies a secure read-only workspace connection and small control messages. This bridge limitation does not define Chat's other authorized capabilities. File evidence is commit-first; bounded authorized RDC reads supplement local context.

Detailed docs below are in English · 详细中文文档见 **[README.zh-CN.md](README.zh-CN.md)**

## One-paste install · 一段话安装

**中文** — 不懂 git、Node、终端？完全不需要懂。把下面这段话原样复制给你的
编码 Agent（Codex），然后去倒杯咖啡：

```text
请帮我完整安装并配置 Codex with ChatGPT，尽量自动完成，我是不懂技术的小白，
所有事情你自己做：

1. 环境自检：需要 git 和 Node.js ≥ 20，缺什么就自动安装
  （macOS 用 Homebrew，Windows 用 winget），同时安装 cloudflared。
2. 下载：把 https://github.com/jack61714z/codex-with-chatgpt 克隆到
   ~/codex-with-chatgpt（已存在则先检查本机变更与版本，按 maintenance 处理；不要自动覆盖）。
3. 构建：在该目录里执行 corepack pnpm install 和 corepack pnpm build。
4. 安装 Skill：先确定 Codex home：如果设置了非空的 CODEX_HOME 就使用它，
   否则使用 ~/.codex（Windows 默认为 %USERPROFILE%\.codex）。把仓库里的
   从 checkout root 按 references/maintenance.md 运行完整目录 helper：
   node scripts/install-skill.mjs ./skill <codex-home>/skills/codex-with-chatgpt [saved-previous-source-skill]
   已有安装使用保存的旧 source 作基准，保留现有机器专用 launcher 规则与回复点。
   若此安装曾遭平台安全拒绝，先走正式 clearance，不重放写入。
5. 首次配置：先读 SKILL.md 入口，再按 references/connection-and-recovery.md
   的 first-time setup 流程执行
  （运行 c2c setup，用内置浏览器打开 ChatGPT 配置连接器并输入配对码）。
   全程只用内置浏览器，禁止打开任何第三方浏览器。
6. 首次连接方式、配置模式、创建 Project、个人同意或手动配置需要我决定时，以及登录（ChatGPT / Cloudflare）、验证码或两步验证时叫我，
   而且一次只告诉我一个动作。
7. 完成后给我看 ✓ 清单，并确认文件读取测试通过。我不懂 MCP、OAuth、
   Tunnel、端口这些词，不要向我解释；出了问题先自己修。
```


**EN** — Don't know git, Node, or terminals? You don't need to. Copy the
paragraph below, paste it to your coding agent (Codex), and go grab a coffee:

```text
Please install and configure "Codex with ChatGPT" for me, with routine steps automated.
I am a non-technical user — do everything yourself:

1. Check the environment: git and Node.js >= 20 must be available. Install
   anything missing yourself (macOS: Homebrew, Windows: winget). Also install
   cloudflared.
2. Download: clone https://github.com/jack61714z/codex-with-chatgpt into
   ~/codex-with-chatgpt (if present, inspect local changes/version and follow maintenance; do not overwrite automatically).
3. Build: inside that folder run `corepack pnpm install` then `corepack pnpm build`.
4. Install the Skill: determine the Codex home first: use a non-empty CODEX_HOME
   when set, otherwise use ~/.codex (%USERPROFILE%\.codex on Windows). From
   the checkout root, follow references/maintenance.md and run
   node scripts/install-skill.mjs ./skill <codex-home>/skills/codex-with-chatgpt [saved-previous-source-skill]
   Existing installs use the saved previous source baseline; preserve backups
   and machine-specific launcher rules. If this installation was
   safety-denied, obtain formal clearance rather than replaying the write.
5. First-time setup: read the SKILL.md entry, then follow the
   references/connection-and-recovery.md "first-time setup" workflow
   (run c2c setup, configure the ChatGPT connector in the BUILT-IN browser,
   enter the pairing code). Never open a third-party browser.
6. Involve me for initial connection/setup-mode choices, Project creation, personal consent or guided manual setup, and logins (ChatGPT / Cloudflare), CAPTCHAs or 2FA —
   and give me exactly ONE action at a time.
7. When done, show me the ✓ checklist and confirm the file-read test passed.
   I don't know what MCP, OAuth, tunnels or ports are. Don't explain them.
   If anything breaks, fix it yourself first.
```


**Updates · 更新** — Update only when requested, following
[maintenance](skill/references/maintenance.md). Read-only update discovery is not
installation permission; preserve local customizations and existing safety holds. After the authorized checkout update/build, run the complete-directory helper with the saved previous source baseline; `c2c update-check` does not install the skill.
仅在被要求时更新，不自动覆写本机客制内容；版本查询不等于安装授权。

---

*The sections below are in English. 以下详细内容为英文，中文完整版见
[README.zh-CN.md](README.zh-CN.md)。*

## Install → Setup → Use (manual)

Let `<codex-home>` be a non-empty `CODEX_HOME` when set; otherwise use `~/.codex`
(`%USERPROFILE%\.codex` on Windows).

1. Install/update the complete `skill/` tree with `node scripts/install-skill.mjs ./skill <codex-home>/skills/codex-with-chatgpt [saved-previous-source-skill]`, following [maintenance](skill/references/maintenance.md). Replace the checkout path in `references/connection-and-recovery.md` and preserve machine-specific launcher rules. A prior safety denial still requires formal clearance.
2. Tell Codex: **"Set up Codex with ChatGPT."** (中文: "使用 Codex with ChatGPT 完成首次配置。")
3. Use Codex normally: **"Use Codex with ChatGPT to implement XXX."**

> **Installation scope:** This repository does not publish or install a Codex
> Web GPT, launcher, or model-catalog entry. Installation consists of building
> this checkout, installing the complete `skill/` directory with its references
> as a Codex Skill, preserving local launcher rules, and running
> `c2c setup` to configure the ChatGPT connector. For Web GPT or model-catalog
> problems, see [troubleshooting](docs/troubleshooting.md).

That's the whole manual. You don't need to know what MCP, OAuth, tunnels,
ports or localhost are — Codex configures everything automatically and you
just see:

```
Codex with ChatGPT

✓ Project detected
✓ Workspace Bridge started
✓ Secure connection established
✓ ChatGPT connected
✓ File read test passed

Ready.
```

The only steps that may need you: logging into ChatGPT (and, if you want a
stable hostname, logging into Cloudflare once). A **new** workspace also asks
you to create a ChatGPT Project (collection) once — pick **project-only
memory**, name it after the workspace. If the sidebar has no Projects row,
hover **Chats**, open the … menu, and choose **Organize by project**. Codex
then saves that collection link and starts chats from that page. Existing
workspaces that already have a C2C chat stay on the old one-conversation
style until you ask to switch.

### Optional stable hostname

The default public address is a temporary Cloudflare URL. It changes when the
bridge restarts, and Codex repairs ChatGPT by deleting that workspace's
connector and adding it again.

If you have a Cloudflare account and a domain already on Cloudflare, first-time
setup (and the next coding session, once) will ask whether you want a stable
hostname such as `c2c-<project>.your-domain.com`. That path opens a browser so
you can authorize Cloudflare. After that, the ChatGPT connector keeps working
across restarts. If you skip it, or the login fails, Codex stays on the temporary
address — same features, just a slower repair.

Credentials stay in the OS app state directory, not in the project.

## How it works

```
             ┌───────────────────────────┐
             │       ChatGPT Web         │
             │  Reason / Plan / Review   │
             └──────────┬──────────▲─────┘
                        │          │
               MCP      │          │ Computer Use
            Data Plane  │          │ Control Plane (<1 KB messages)
                        ▼          │
             ┌─────────────────────┐
             │      C2C Bridge     │   loopback-only HTTP server
             │  read-only MCP      │   OAuth 2.1 + one-time pairing code
             │  OAuth + Pairing    │   Cloudflare Quick Tunnel
             │  Tunnel Manager     │
             └──────────┬──────────┘
                        │  read-only
                        ▼
             ┌─────────────────────┐          ┌─────────────────────┐
             │   Local Workspace   │◀─────────│    Codex Harness    │
             └─────────────────────┘ edit/git │ shell / tests / fix │
                                              └─────────────────────┘
```

- **Control plane (Computer Use)**: Codex and ChatGPT exchange tiny structured
  `[C2C]` state messages — `INIT → PLAN → EXECUTED → REVIEW → DONE`. No diffs,
  no logs, no file bodies are ever pasted.
- **Data plane (MCP)**: ChatGPT pulls what it needs itself through 10 read-only
  tools: `workspace_info`, `list_directory`, `read_file`, `search_workspace`,
  `git_status`, `git_diff`, `test_status`, `execution_summary`,
  `execution_output`, `read_image`.
- **System review**: Chat reads actual committed changes and necessary affected context against original requirements in both directions. Receipts, digests and green tests do not alone prove acceptance. Local commits without a push have no remote audit record.

### Generated media handoff

The connector remains read-only: `read_image` can inspect supported workspace
images but cannot write files. After a requested image or video is downloaded
through the visible ChatGPT UI, the local executor can validate and import the
original with `c2c asset import -w <workspace> --from <download> --to <new-path>`.
Imports are workspace-contained, signature-checked, size-limited, reject active
SVG content, and never overwrite an existing file.

## Security model (short version)

- **Read-only by construction**: write/delete/shell/commit tools simply do not
  exist on the server. No prompt injection can enable them.
- **One workspace = one boundary**: every token is bound to a single workspace;
  path containment uses canonical realpaths (symlink/`../`/absolute-path escapes
  are all blocked and tested).
- **Sensitive files never leave**: `.env*`, keys, SSH, credentials are denied by
  default (`.env.example` allowed); `.c2cignore` adds your own rules.
- **Knowing the URL grants nothing**: the public MCP endpoint requires OAuth 2.1
  (PKCE S256, dynamic client registration, rotating refresh tokens). Without a
  token: 401. Wrong workspace: 403.
- **The model never sees long-lived credentials**: the only secret that ever
  touches a browser is a one-time pairing code (5-minute TTL, 5 attempts,
  rate-limited, destroyed on use).

Full threat model: [docs/security.md](docs/security.md)

## For developers

```bash
pnpm install
pnpm build          # -> dist/, exposes the `c2c` bin
pnpm test           # vitest: relevant suite (path security, OAuth, pairing, MCP e2e)

c2c setup           # bridge + tunnel + pairing code, all in one
c2c sandbox-allow   # whitelist the settings dir in Codex (macOS + Windows)
c2c status / doctor / pair / unpair / logs / stop
```

Requirements: Node.js >= 20, git. `cloudflared` for the public connection
(auto-detected; the Skill installs it for you). If QUIC is blocked, set
`C2C_TUNNEL_PROTOCOL=http2` and restart the bridge.

Docs: [architecture](docs/architecture.md) · [protocol](docs/protocol.md) ·
[security](docs/security.md) · [troubleshooting](docs/troubleshooting.md)

## Project layout

```
src/
  bridge/     loopback HTTP server, port recovery, admin API
  mcp/        10 read-only tools, stateless Streamable HTTP
  auth/       OAuth 2.1 (PKCE, DCR, refresh rotation, revocation)
  pairing/    one-time pairing codes (CSPRNG, TTL, rate limits)
  workspace/  path containment, sensitive-file policy, search, git
  tunnel/     TunnelProvider abstraction + Cloudflare Quick/Named Tunnel
  execution/  execution records for the review loop
  process/    daemon lifecycle
  cli/        the c2c CLI
skill/        the Codex Skill (the real UX layer)
tests/        unit + integration tests
docs/         architecture / protocol / security / troubleshooting
```

## Status & disclaimer

V1. Verified end-to-end: bridge, OAuth + pairing, public tunnel, ChatGPT
connector setup, zero-touch first-run experience.

**Unofficial community project. Not affiliated with or endorsed by OpenAI.**

## License

[MIT](LICENSE)

## Star History

<a href="https://www.star-history.com/?repos=xiaoduoya%2Fcodex-with-chatgpt&type=date&legend=top-left">
 <picture>
   <source media="(prefers-color-scheme: dark)" srcset="https://api.star-history.com/chart?repos=xiaoduoya/codex-with-chatgpt&type=date&theme=dark&legend=top-left" />
   <source media="(prefers-color-scheme: light)" srcset="https://api.star-history.com/chart?repos=xiaoduoya/codex-with-chatgpt&type=date&legend=top-left" />
   <img alt="Star History Chart" src="https://api.star-history.com/chart?repos=xiaoduoya/codex-with-chatgpt&type=date&legend=top-left" />
 </picture>
</a>

For complete local text installation/update with customization preservation, use `node scripts/install-skill.mjs ./skill <destination> [saved-previous-source-skill]` after saving a recovery copy; see [maintenance](skill/references/maintenance.md). Full records use [canonical format 1.0.1 / package 0.3.2](skill/references/full-format.md). This is the contract version, not a C2C runtime package version bump.
