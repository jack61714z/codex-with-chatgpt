# C2C connection and recovery

Load only for setup, pairing, browser use, workspace binding or recovery. An EPERM filesystem error may use the formal platform approval route; a safety rejection must not be retried through another tool/agent or treated as EPERM. Collaboration roles and evidence exchange are defined in collaboration-policy.md.

2. NEVER show the user technical internals (MCP, OAuth, PKCE, tunnel, ports, localhost).
   Speak in terms of "连接 ChatGPT / 安全连接 / 配对". The only exception is the
   **guided manual ChatGPT setup** below: expose only the exact settings
   field labels/values the user must enter, without explaining internals.
3. The pairing code is the ONLY credential you may ever type into a browser.
   Never touch OAuth tokens, cookies, or session storage.
4. At the first meaningful failure, preserve evidence and use Progressive Investigation per the shared policy. For a suspected local connection fault, use `c2c doctor --no-fix --json` only within authorization for runtime reads and possible endpoint persistence; repair only the diagnosed, authorized cause. `--no-fix` disables repairs, but a healthy tunnel can still save endpoint metadata and refresh `savedAt`. Doctor/status can use the local admin token internally; never inspect or disclose it. Strictly read-only inspection without runtime or credential access uses source and nonsecret repository metadata instead. Only involve the user
   for logins, CAPTCHA, 2FA, explicit consent screens, or **guided manual
   ChatGPT setup** below — and then give them ONE action.
   Before the first ChatGPT connection on this machine, `c2c prefs --json`:
   - `setupMode` missing: tell the user exactly `setupChoicePrompt`, wait for
     「1」or「2」, then `c2c prefs set --setup-mode auto|manual --json`.
     Do not start ChatGPT configuration until they answer. Do not guess.
   - `setupMode` is `manual`: skip automatic ChatGPT settings. Use guided
     manual from the start (chosen, not a failure).
   - `setupMode` is `auto`: automatic browser setup. Two explicit failures of
     the same configuration step after repair then enter guided manual.
     A browser/js timeout, a page still loading/generating, or waiting for
     user login/2FA does NOT count as a failure. Do not change the saved
     `setupMode` when falling back.
   `developerModeEnabled: true` means skip `#settings/Security` until a
   connector create fails because developer mode is required. Then open
   that page, enable it, and `c2c prefs set --developer-mode --json`.
   These prefs are for this machine, not per workspace. Do not ask again
   on reconnect or a second repo. A new computer (empty prefs) asks/checks
   once.
5. Use the built-in in-app browser (iab) for ChatGPT steps by default; no screenshot-click Computer Use and no external-browser launch by default. Two explicit, scoped exceptions are permitted only when provider capabilities and platform permissions allow them:
   - Cloudflare login in the user's own browser session: require the user's explicit request for that single login step; then return to iab.
   - ChatGPT in the user's own browser: first explain that repeated page operations may affect normal browser use. Proceed only after explicit informed consent accepting that impact (for example 「我愿意承担影响」); otherwise stay in iab. Consent is about the stated impact, not a magic phrase or blanket permission.
   Saved preferences do not substitute for these personal-consent boundaries.
6. Conversation reuse depends on `c2c session --json` → `conversation.mode`
   (see Conversation management). Do not invent a second mode.
   - **long-chat** (legacy session file, or the user opted out): ONE ChatGPT
     conversation per workspace. Never silently start a new chat.
   - **project** (new workspaces, or an existing workspace that opted in):
     ONE ChatGPT Project (collection) per workspace. Same Codex conversation
     reuses the ChatGPT chat URL saved in THIS thread. A new Codex
     conversation opens a new chat from the Project collection page — never
     `goto` `https://chatgpt.com/` to create it, and never reuse another
     Codex conversation's chat URL just because `session.url` exists.
   Each workspace also has exactly ONE ChatGPT connector. Do not create a
   second connector for the same workspace. Other workspaces may have their
   own connectors — never edit those. A separately requested GitHub-plugin
   chat in the same Project does not replace the saved C2C chat URL unless
   it also passes the workspace_info check.
7. After first-time setup, never ask the user to approve writing C2C's local
   settings directory. Run `c2c sandbox-allow --json` (idempotent). If it fails
   with EPERM / Operation not permitted, request elevated permissions and retry
   ONCE. After `{ "alreadyAllowed": true }` or `{ "added": true }`, stay silent.
8. ChatGPT pages: only the URLs in **In-app browser (ChatGPT)**. Never start
   from chatgpt.com and click through menus.
9. **Doctor gate.** After `c2c doctor --json`, do not `goto` ChatGPT and do not
   send `[C2C]` until local is green — except the reconnect settings pages when
   `chatgptRepair.needed` is true. Not green:
   - `report.bridge.ok` is not true
   - `report.mcp.ok` is not true (unauthenticated local `/mcp` must be 401)
   - sandbox / state-dir write failed (EPERM)
   - this workspace used to have a public URL and the tunnel is down
   - `chatgptRepair.needed` is true (fix the connector first, then doctor again)
   - `namedRepair.needed` is true (user must log in to Cloudflare, then doctor again.
     Do not Delete the ChatGPT connector — the address did not change)
   - `report.bridge` says 状态无法确认: the local bridge may still be running.
     Do not `c2c start`, do not Delete the connector, do not treat it as
     `chatgptRepair`. Wait and run doctor again.
   If doctor is already green and `chatgptRepair.needed` is false, do not
   `c2c restart`, do not start a second tunnel, and do not Delete the
   connector. ChatGPT/IAB-only errors are not permission to churn the
   public address.
   A ChatGPT-side 401 after a sent message is different: repair then, do not
   treat it as permission to skip this gate next time.

## In-app browser (ChatGPT)

Use the currently exposed browser provider's actual documentation. Provider APIs and surface names differ between hosts; never transplant this task's adapter signatures into another host or initialize a browser when the current task prohibits UI use.

1. **Surface.** Follow the current provider's documented initialization and first-matching selection rules. Resolve available browsers/tabs/surfaces through its documented discovery or selection route, and use only documented signatures and options. If the provider requires exactly one entry call on first invocation, make that call alone and read the returned documentation/state before continuing. Restore documentation on summarized-task resume only by a method the current provider actually documents. No browser ID, visibility option, legacy runtime or mark method is assumed by this policy.

`goto` below means the selected provider's documented navigation operation, not an assumed callable method.

2. **One tab.** Reuse the existing authorized C2C tab; create one only when no suitable tab exists, using the current provider's documented signature. The default remains the user-required built-in in-app browser. If that surface is unavailable or cannot be identified through supported metadata, report the surface blocker or use an already-authorized guided manual route. Never silently substitute another browser/surface, install an invented runtime or infer authority from available capabilities. Navigate only when the target differs.

3. **Foreground + keep (standby).** Request visibility and retention only through controls/options documented by this provider. Preserve the same tab across setup, waiting and continuation. Do not call unexposed handoff/deliverable methods or promise retention beyond provider capabilities. If foreground/retention cannot be controlled, disclose that limitation and preserve the saved URL/checkpoint. Never close the C2C tab as cleanup.

4. **URLs only** (same tab, provider-documented navigation — never hunt menus):
   - 开发人员模式: `https://chatgpt.com/#settings/Security`
     (skip when `c2c prefs --json` has `developerModeEnabled: true`)
   - 插件总管: `https://chatgpt.com/plugins`
   - 加插件: `https://chatgpt.com/plugins#settings/Connectors?create-connector=true&redirectAfter=%2Fplugins`
   - 新对话 (long-chat only, and only if no saved chat): `https://chatgpt.com/`
   - Saved C2C chat: `conversation.chatUrl` / `session.url` (long-chat, or
     the chat already bound in THIS Codex conversation)
   - Saved Project collection: `conversation.projectUrl`
     (`https://chatgpt.com/g/g-p-…/project`)
   Never click Reconnect / Refresh on an existing connector. The old address is
   dead and that page hangs on "This site cannot be reached". When the address
   changed: Delete THIS workspace's `connectorName` only, then create it again
   via the 加插件 URL (same name, new Server URL). Do not put that public
   address into Project instructions — write the connector **name** only.

5. **Do not wait for 8 tools** on the settings page. "Connected" / authorize
   success / pairing accepted is enough. Confirm tools in the conversation with
   `workspace_info`.

6. **Batch.** Fill a known form using the selected provider’s documented DOM/locator APIs when available.
   After an action, one cheap DOM check. Do not screenshot-poll.

7. **One conversation, Chat mode.** The first ChatGPT chat is the C2C
   conversation. Chat and Work (聊天 / 工作) are separate: a Work conversation
   cannot become Chat. On every NEW conversation, if a Chat/Work switcher is
   visible (often top-left), confirm **Chat** is selected before the boot
   prompt. If it is Work, do not continue there — Switch to a new Chat
   conversation (HANDOFF). If no switcher is visible, do not hunt menus; continue.
   Send the boot prompt and the workspace_info check in that Chat conversation.
   Confirm the reply names the current workspace **before** saving or replacing
   the session URL. If validation fails, keep the old saved URL. Do not open a
   throwaway verify chat and later another C2C chat.

   A collection or chat page that shows only `Retry` / `重试` is a navigation
   error, not generation and not a pairing failure. Reuse the same iab tab.
   Try Retry once. If it stays Retry-only, `goto` the last working chat URL
   from this thread (or `session.url` if that is the only saved chat), then
   click the on-page `Open … project` / `打开“… ”项目` link — that same-site
   hop is allowed. Do not treat the URLs-only rule as forbidding this link.
   On the collection, require the project chat list and new-chat composer
   before continuing. Keep the old saved URL/checkpoint until the replacement
   chat passes workspace_info. Do not `session clear`. Do not use Computer Use.

8. **Wait for a ChatGPT reply (do not hold one long browser wait).** After you
   send INIT, EXECUTED, boot, or the workspace_info check: preserve the tab/checkpoint, keep
   the tab foreground, and stay in this same task. Do not `waitFor` 5 minutes
   and do not screenshot-poll. Every 20–30 seconds, one cheap DOM check:
   - still generating → wait again (do not type, do not resend);
   - `STATE: PLAN` / `DONE` / `BLOCKED` / the verify workspace name → read it
     and continue the existing protocol;
   - visible error → repair; do not start a new chat.
   A browser/js timeout is not failure. Claim the same tab, read the page, keep
   standby. If ChatGPT is still thinking, keep polling while there is observable progress. If repeated checks show no progress, preserve the sent state/URL/checkpoint, report the stall and pause this wait for an evidence-based continuation; do not restart, resend or recreate the connector. Never open a second
   tab and never resend INIT/EXECUTED just because a wait timed out.

## Locations

- The codex-with-chatgpt checkout lives at: `<ACTUAL_CHECKOUT_PATH>`
  (installer/update MUST replace this line in the installed connection reference with the user's actual checkout path.)
- Codex home: let `<codex-home>` be a non-empty `CODEX_HOME` when set; otherwise
  use `~/.codex` (`%USERPROFILE%\.codex` on Windows).
- CLI: preserve the existing machine-specific launcher below; it takes precedence
  over generic examples. Use the installation’s configured launcher for `<command>`.
  Only on installations without such a launcher may the generic
  `node "<checkout>/bin/c2c.js" <command>` example apply. All commands support `--json`.
- If the checkout has no `node_modules` or no `dist/`, first run
  `corepack pnpm install && corepack pnpm build` inside it.
- For commands that act on the user's project (`setup`, `doctor`, `session`,
  `restart`, `start`, `stop`, `status`, `pair`, `unpair`, `logs`, `workspace`,
  `record`, `tunnel status`, `tunnel choose`), pass `-w <workspace root>`
  (the project the user is working on, NOT the c2c repo).
- Do not add `-w` to machine-wide commands: `update-check`, `sandbox-allow`,
  `prefs`, `tunnel login`. They still accept and ignore `-w`, so a leftover
  flag must not fail the command.

## Connection choice (once per workspace)

Ask this **before** the public address exists (`c2c setup` / first `doctor --fix`
that starts a tunnel). Do not mention tunnels, wrangler, DNS, or hostnames.
Speak only of 临时地址 / 固定域名 / 登录 Cloudflare.

1. `c2c tunnel status -w <workspace> --json`
2. If `needsChoice` is false: do not ask again.
3. If `needsChoice` is true: tell the user exactly `userPrompt` and wait.
   - 没有账号 / 没有域名 / 临时 / 不用 →
     `c2c tunnel choose -w <ws> --mode quick --json`
   - 有域名（例如 example.com）→ first tell them `loginPrompt`. Before any command that may open the user's own browser, require the explicit own-session Cloudflare login request in rule 5. If that consent is absent and no supported iab/manual route is available, report that login-route blocker; do not run an external-launch command. Once those conditions are satisfied, run
     `c2c tunnel choose -w <ws> --mode named --zone <domain> --json` and wait for completion.
     If they said they have an account but gave no domain: ask once for the
     domain. If the command returns `need: "zone"`, ask once and retry.
     If `fallback` is true: tell them `userMessage` and continue on the
     temporary address. Do not retry named unless they ask.
4. Never put connection credentials in the project. The CLI stores them in
   the C2C state directory.

## Workflow: first-time setup（"使用 Codex with ChatGPT 完成首次配置"）

1. Detect prerequisites yourself: `node --version` (>= 20), and check `cloudflared`.
   - If cloudflared is missing on macOS run `brew install cloudflared`; on Windows use
     `winget install Cloudflare.cloudflared`. Do this yourself; don't ask.
2. If the c2c repo has no `node_modules`, run `pnpm install && pnpm build` in it.
3. Run `c2c sandbox-allow --json`, then **Connection choice**, then
   `c2c setup -w <workspace> --json`.
   `sandbox-allow` edits Codex `config.toml` only — it adds C2C's state directory
   to `[sandbox_workspace_write].writable_roots` so later chats can write logs
   without elevation. If the write is denied, request approval and retry once.
   → returns `{ mcpUrl, pairingCode, workspaceName, connectorName, ... }`.
   `connectorName` is this workspace's plugin title (legacy installs stay
   `Codex with ChatGPT`; additional workspaces get `Codex with ChatGPT · <name>`).
   Pairing codes expire in ~5 minutes. Do not mint one until the ChatGPT
   Authorize / pairing form is on screen: run `c2c pair --json` then type
   that code immediately. Doctor does not pre-mint a code.
4. `c2c prefs --json` (this machine, not this workspace).
   - If `setupMode` is null: tell the user exactly `setupChoicePrompt`. Wait
     for「1」or「2」. Then `c2c prefs set --setup-mode auto` or `--setup-mode manual`.
     Do not open ChatGPT settings and do not start automatic configuration
     until they answer. Do not default to auto.
   - If they later ask to switch: same `c2c prefs set --setup-mode` command.
     Do not re-ask on a later workspace or on reconnect.
   - `setupMode: "manual"`: skip step 5's automatic ChatGPT settings. Go to
     **Guided manual ChatGPT setup** (chosen). Opening line:
     `接下来用手动教学配置。一次只需要做一个操作。`
     Do not say 自动配置没有成功.
   - `setupMode: "auto"`: continue with step 5. Keep the two-failure fallback.
5. Open ChatGPT on the ONE iab tab (see **In-app browser**). Foreground +
   preserve the tab/checkpoint immediately. Same tab, `goto` only:
   - 开发人员模式: skip `https://chatgpt.com/#settings/Security` when
     `developerModeEnabled` is true. Otherwise open it, enable 开发人员模式
     ("Developer mode") if it is off, then `c2c prefs set --developer-mode`.
     Never record it as off. If creating the connector later says developer
     mode is required, open this page, enable it, save `--developer-mode`,
     and retry create — do not skip that recovery.
   - 已有该 `connectorName`: `https://chatgpt.com/plugins` — Delete it (never
     Reconnect). Then `goto` the 加插件 URL below.
   - 还没有 / 刚删掉: `https://chatgpt.com/plugins#settings/Connectors?create-connector=true&redirectAfter=%2Fplugins`
     Operate ONLY on `connectorName` from step 3:
      - If that exact name exists: Delete it, then create it again. Never
        Reconnect, never edit-in-place, never open the old Server URL.
      - If it does not exist: create one with that exact name.
      - Never rename, delete, or edit a connector that belongs to another workspace.
      - Description: `Securely connect ChatGPT to the current Codex workspace for planning and review.`
      - Server URL: the `mcpUrl` from step 3
      - Authentication: OAuth
     Fill the known form in one script when you can. Then Connect / Authorize.
     Only then run `c2c pair --json` and type that code. As soon as it shows
     Connected / authorized / pairing accepted, continue — do NOT wait for 8
     tools on this page.
6. Same tab: open the first C2C chat per **Conversation management**
   (Project collection for a new workspace; `https://chatgpt.com/` only
   in long-chat). Confirm Chat mode per **In-app browser** §7 (if it is Work,
   open a new Chat conversation instead). Send the boot prompt from
   [protocol.md §Boot prompt](protocol.md#boot-prompt), then (same chat) send:
   `Use the "<connectorName>" connector: call workspace_info and read hello-style top-level file. Reply with the workspace name.`
   Confirm the reply matches `workspaceName` (wait per **In-app browser** §8).
   Only then save the chat URL with `c2c session set` (see Conversation
   management). If the name does not match, do not save. preserve the verified tab and URL.
7. Report to the user exactly in this shape (no internals):

```
Codex with ChatGPT

✓ 当前项目已识别
✓ Workspace Bridge 已启动
✓ 安全连接已建立
✓ ChatGPT 已连接
✓ 文件读取测试通过

Ready.
```

If a login wall appears (ChatGPT, Cloudflare): stop, tell the user the ONE thing
to do ("请登录 ChatGPT，完成后告诉我'好了'"), then continue.

### Guided manual ChatGPT setup

Enter this path when `setupMode` is `manual` (chosen at the start), or when
automatic ChatGPT browser configuration fails twice at the same explicit
setup/reconnect step after `c2c doctor` / repair. Do NOT enter the failure
path for a browser/js timeout without a visible error, a page that is
still loading/generating, or while waiting for login / 2FA / CAPTCHA.
A chosen manual path does not wait for those two failures.

Stop automating ChatGPT settings. Keep the current local C2C state and the
current `mcpUrl`, `pairingCode`, `workspaceName`, and `connectorName`. Do not
silently fall back to Codex-only execution and do not permanently disable C2C.
Do not change the saved `setupMode` when this is a failure fallback.

Opening line:

- Chosen (`setupMode: "manual"`): `接下来用手动教学配置。一次只需要做一个操作。`
- Failure fallback: `自动配置没有成功，我来带你手动完成。一次只需要做一个操作。`

Then guide ONE action at a time, waiting for the user to say「好了」before the
next action:

1. If `developerModeEnabled` is not true: ask them to open
   `https://chatgpt.com/#settings/Security` and enable 开发人员模式. After they
   say「好了」, `c2c prefs set --developer-mode`. If it is already remembered,
   skip this step.
2. Ask them to open `https://chatgpt.com/plugins`. If the exact `connectorName`
   exists, delete only that connector. Never ask them to touch another workspace's connector.
3. Ask them to open
   `https://chatgpt.com/plugins#settings/Connectors?create-connector=true&redirectAfter=%2Fplugins`
   and create the exact `connectorName` with:
   - Description: `Securely connect ChatGPT to the current Codex workspace for planning and review.`
   - Server URL: the current `mcpUrl`
   - Authentication: OAuth
4. Ask them to Connect / Authorize. Then run `c2c pair --json` and give them
   only that pairing code. If it expires before they finish, run pair again.
5. When they report Connected / authorized / pairing accepted, resume the normal
   setup/reconnect flow at its ChatGPT verification step. If automatic browser
   verification then hits the same explicit failure twice, stop and report the
   exact failed step; do not loop indefinitely and do not continue without C2C.

## Conversation management

`c2c session -w <ws> --json` → `{ session, conversation }`.
`conversation.mode` is the only switch. Missing / legacy files with a chat URL
and no Project stay **long-chat**. Do not ask those users to migrate. If they
later say they want a Project, run **Bind Project**. A brand-new workspace
(no session file) is **project**.

Never match a Project or a chat by display name. Never upload the repo to
Project sources. Never click 分享 / Share. Do not rename ChatGPT chats.

### long-chat (do not rewrite this path)

ONE ChatGPT conversation per workspace. Same as before.

- **Find it**: if `conversation.reuseSavedChat` and `conversation.chatUrl`,
  `goto` that URL (foreground + preserve tab/checkpoint) and continue there.
- **Save it**: after boot + workspace_info, and the reply names this workspace,
  `c2c session set -w <ws> --mode long-chat --url <url> --title "C2C <workspace name>"`.
  If the name does not match, do not overwrite a previously saved URL.
- **Update it**: after each EXECUTED/DONE,
  `c2c session set -w <ws> --task <id> --iteration <n> --state <STATE>`
  plus explicit checkpoint flags from [Runtime checkpoint transitions](protocol.md#runtime-checkpoint-transitions) (`--protocol-state`,
  `--waiting-for`, `--goal`, `--next-step`, `--known-issues`, or
  `--clear-checkpoint` on DONE). Do not put logs or diffs in those fields.
- **Switch it** ONLY when (a) the user asks for a new chat, (b) the current
  chat visibly lags, or (c) this conversation is Work. Then:
  1. Same iab tab: `goto` `https://chatgpt.com/`, confirm Chat mode
     (**In-app browser** §7), then send the boot prompt.
  2. Send a HANDOFF ([protocol.md](protocol.md)) — goal, progress, state, issues,
     next step. Never paste files.
  3. workspace_info check; only then `c2c session set --url`. On failure,
     leave the old saved URL unchanged.
- Saved chat 404s: treat as a switch. Reconstruct HANDOFF from
  `session.checkpoint` (goal, progress, issues, next step). If there is no
  checkpoint, use `task` / `iteration` / `lastState` and `execution_summary`
  metadata only. Never paste logs or output bodies.

### project (new workspaces)

One ChatGPT Project per workspace. Mapping:

1. Same Codex conversation (this thread still has context) → same ChatGPT
   chat URL. `goto` that URL directly. Do not open the collection first.
2. Same workspace, a **new** Codex conversation → new ChatGPT chat from the
   collection page (`conversation.projectUrl`). Ignore `session.url` unless
   you already saved it earlier in THIS Codex thread.
3. Different workspace → different Project and different connector.

**Open a chat in this Codex thread**

- If you already saved a ChatGPT chat URL earlier in THIS Codex conversation:
  `goto` that URL. Continue. No new chat. No HANDOFF.
- Else if `conversation.projectReady`: `goto` `conversation.projectUrl`.
  On that page, use the on-page composer (「{项目名}中的新聊天」 / "New chat
  in …"). Do not use the sidebar and do not `goto` `https://chatgpt.com/`.
  Confirm Chat mode (**In-app browser** §7). Boot prompt, then workspace_info
  with the **exact** `connectorName`. After the reply names this workspace,
  `c2c session set -w <ws> --mode project --project-url <collection> --url <chat> --connector-name "<connectorName>" --title "C2C <workspace name>"`.
  If this Codex thread is continuing a previous C2C task, send HANDOFF right
  after the boot prompt.
- Else: **Bind Project** first.

**Update it**: same `c2c session set --task / --iteration / --state` as long-chat.

**Wrong collection**: do not guess another Project. Tell the user the expected
workspace name, ask them to open the right collection, then say「已找到」.
Also offer「继续用长对话」. If they pick long-chat:
`c2c session set -w <ws> --mode long-chat` and use the long-chat path.
If the collection 404s or the new chat is not inside the Project, same choice.

**Saved chat 404s** (this thread): `goto` the collection, open a new chat
there, boot + HANDOFF from `session.checkpoint` (no logs) + workspace_info,
then save the new chat URL. Keep `--project-url`.

### Bind Project (user creates the collection once)

Do this for a new workspace, or when an existing user asks to switch to
Project. Do **not** click the ChatGPT sidebar to create the Project
(Computer Use is forbidden; IAB must not hunt that menu).

1. Tell the user exactly this (fill in the workspace name):

```
请在 ChatGPT 里新建一个项目，名字用「<workspaceName>」，记忆请选「仅限项目记忆」。

如果侧栏里看不到「项目」：把鼠标放在「聊天」上，点右边出现的三个点，选择「按项目整理」。

建好后会打开合集页面。看到页面后跟我说「好了」。
```

2. Wait for「好了」/ the collection page. Same iab tab: read the address bar.
   It must look like `https://chatgpt.com/g/g-p-…/project`. If it does not,
   ask them to open that project until it does. Then:
   `c2c session set -w <ws> --mode project --project-url <url> --connector-name "<connectorName>"`.

3. On that same collection page only, open 右上角 **… → 项目设置**.
   Do not click 分享. Do not add 来源 / files.
   - 记忆: 仅限项目记忆 (project-only). Leave 库访问权限 disabled.
   - 指令: paste **Project instructions** below (fill `{{…}}` from
     `workspace_info` / setup). Use the exact `connectorName` from setup.
     Never write the public / temporary address into 指令.
   Save and close settings.

4. Still on the collection page, create the first chat with the on-page
   composer, then boot + workspace_info as in setup step 5. Save the chat URL.

### Project instructions (paste into 项目设置 → 指令)

Use the canonical [full records](full-format.md) with the [protocol templates](protocol.md). Chat must actually read original requirements, cumulative changes and affected context and answer all seven drift axes; a test summary alone is insufficient. Codex completion asks exactly: Chat，請依原始目標與累積變更實際審查：是否造成整體飄移？

```
Chat investigates, plans and reviews within delegation. Codex.app is the daily single repository writer; explicit user exceptions bind actual executor and scope. Follow the shared Chat / Codex collaboration policy; do not create a second human approval for routine scoped Chat decisions.

Use the canonical full WORK_ORDER, EXECUTION_RESULT and CHAT_REVIEW contract, format 1.0.1 / package 0.3.2, at the installed codex-with-chatgpt skill's references/full-format.md (source checkout: skill/references/full-format.md), together with references/collaboration-policy.md. Actually read the bound source; a locator alone is not evidence. If unavailable, mark that source/decision UNKNOWN and request the authorized contract from Chat without uploading workspace files. Save durable GitHub records only when destination and publication are authorized; otherwise prepare the full record in the existing authorized conversation, mark its durable link UNKNOWN, and report that limited delivery gap. Local evidence may supplement that conversation record; it is not a prerequisite.

Chat must read the original goal, cumulative actual changes and affected context and substantively assess all seven axes: original_goal, scope, interfaces, architecture, workflow_ownership, runtime_data_security, related_dependencies. Codex completion asks exactly: Chat，請依原始目標與累積變更實際審查：是否造成整體飄移？ Green tests and receipts alone do not establish acceptance.

Reuse completed bound clarity/interviews. At the first meaningful failure invoke Progressive Investigation, preserve evidence and identify the supported cause to sufficient depth without treating the first plausible cause as proven; a new attempt needs new evidence and a changed strategy, never an identical blind retry. Ponytail simplification/debug/testing stays a narrow method, including its requested-report exception. Preserve real permission/security boundaries and existing applicable final-wave caps; these are not universal caps for every first error.

This Project is bound only to:
- Workspace name: {{workspace_name}}
- Kind: {{project_type}} ({{languages}} / {{frameworks}})
- Workspace connector: {{connector_name}}

Validate workspace_info before using this C2C connector; a mismatch pauses those reads. Never use another workspace's connector. Primary file evidence is the authorized repository's pushed commit plus relative paths. Authorized Remote Desktop Commander can supplement exact local context. A read-only workspace connector does not remove available GitHub/RDC write capabilities or grant new authority. Do not request pasted files/diffs/logs or repository uploads.

Review actual changes against original requirements and impacted callers/interfaces/state/workflow, not only C2C wording or passing tests. Live code establishes facts; user delegation and applicable contracts establish permission. HANDOFF locates history and remaining work, not new authority. Memory can be stale. Preserve completed work and one writer; do not treat a handoff as a new task.

Codex proposes merge candidates to Chat. Chat reviews, asks the user about the concrete PR/head, then the explicitly assigned executor executes/readbacks that approved exact-head merge. Platform restrictions and personal-consent boundaries remain in force.
```

### GitHub plugin in a Project chat

The C2C connector reads the local workspace; it is not the GitHub plugin.
An installed and connected GitHub plugin may still be absent from an older
conversation's callable tools. Do not diagnose that as a C2C pairing or
tunnel failure, and do not recreate the workspace connector to fix it.

When the user has assigned GitHub operations to ChatGPT and the current
conversation lacks GitHub actions, use the same Project's collection page
in the existing in-app browser tab. In its new-chat composer, type
`@github` and **select the GitHub plugin suggestion** so it becomes a
plugin pill; plain `@github` text is not a selection. Start with one
read-only GitHub call and confirm the expected repository before any
already-authorized write. Preserve the existing C2C session URL unless
the new chat also passes `workspace_info` for this workspace. If the
GitHub action is still unavailable, report that exact per-chat blocker.

For an authorized GitHub write, use the reviewed title/body unchanged,
search for an existing target when duplication matters, publish once,
then read back. An ambiguous result calls for readback, never a blind
retry. This does not authorize additional scope or local source changes.

## Workflow: ChatGPT-generated media

The connector remains read-only. It can view supported PNG/JPEG/GIF/WebP/SVG
files with `read_image`, but it cannot write into the repository or retrieve a
browser download by itself.

When the user asks ChatGPT web to generate an image or video:

1. Generate it in the workspace's saved ChatGPT conversation using the same
   built-in browser tab and connector rules above.
2. Activate the finished asset's actual Download control through the visible
   ChatGPT UI. Browser screenshots are navigation evidence only; never save,
   crop, rename, or import a screenshot as the requested asset.
3. Import the original download through the local execution harness:
   `c2c asset import -w <ws> --from <downloaded-file> --to <new-workspace-relative-path> --json`.
4. The destination must be new and project-relative. The importer validates
   PNG/JPEG/GIF/WebP/SVG/MP4/MOV/WebM content, rejects active SVG and path
   escapes, and never overwrites an existing file. Include the imported path in
   EXECUTED/review.

## Workflow: disconnect（"断开 ChatGPT"）

1. `c2c unpair -w <workspace>` (revokes all tokens immediately).
2. Optionally remove the connector on the same iab tab via
   `https://chatgpt.com/plugins` (foreground + preserve tab/checkpoint). Only touch
   this workspace's `connectorName`.
3. Tell the user: "已断开 ChatGPT 对该项目的访问。"

## Workflow: reconnect after address reclaim（全关掉以后地址失效）

This is the normal case when the user quit Codex / the terminal / the machine:
the previous public address is gone. Doctor already started a new one.
`connectorAction: "update"` means Delete + create again — not Reconnect.

`c2c doctor --json` will look like:
`{ "chatgptRepair": { "needed": true, "connectorAction": "update", "connectorName": "...", "userMessage": "...", "mcpUrl": "...", "pages": { ... } } }`

1. Tell the user exactly `chatgptRepair.userMessage`. Then you repair. Do not
   ask them to click around ChatGPT unless a login wall appears. Do not open
   the C2C chat and do not send `[C2C]` until this repair finishes and a
   follow-up doctor is green. Never "try a message first to see if it works".
   Reuse `c2c prefs --json`. Do not re-ask setup mode. If `setupMode` is
   `manual`, use **Guided manual ChatGPT setup** (chosen) instead of automating.
2. Same one iab tab as setup (foreground + preserve tab/checkpoint). Settings URLs only
   until Connected — never hunt menus:
   - 开发人员模式: skip `https://chatgpt.com/#settings/Security` when
     `developerModeEnabled` is true. If create/delete then says developer
     mode is required, open it, enable, `c2c prefs set --developer-mode`.
   - 插件总管（只用来 Delete）: `https://chatgpt.com/plugins`
   - 加插件（Delete 之后必走）: `https://chatgpt.com/plugins#settings/Connectors?create-connector=true&redirectAfter=%2Fplugins`
3. Operate ONLY on `chatgptRepair.connectorName`. Never touch another
   workspace's connector.
   - If that exact name exists on the plugins hub: **Delete** it. Confirm the
     delete if ChatGPT asks. **Never click Reconnect, Refresh, Connect, or
     Edit** on the old card — the old Server URL is dead and the page will
     hang on "This site cannot be reached".
   - Then `goto` the 加插件 URL and create that **same** `connectorName`
     (do not invent a second name):
      - Description: `Securely connect ChatGPT to the current Codex workspace for planning and review.`
      - Server URL: `chatgptRepair.mcpUrl`
      - Authentication: OAuth
     Then Connect / Authorize. Only then run `c2c pair --json` and type that
     code. Continue as soon as it is Connected — do not wait for 8 tools on
     the settings page.
   - If the name is already gone, skip Delete and only create.
4. `c2c doctor --json` again. Same tab: only after the Doctor gate is green,
   reopen the chat this Codex thread was already using (`session.url` /
   the URL you saved earlier in THIS thread). Do not rewrite Project
   instructions — they store the connector **name**, which did not change.
   In that same chat, send the workspace_info check from setup step 6
   (exact `connectorName`). Doctor green is not enough: the old conversation
   may still be bound to the deleted connector.
   - If the reply names this workspace: continue there. Save the URL if needed.
   - If workspace_info fails, times out, or cannot read the name: do **not**
     keep retrying that old URL. project → collection page, new chat in this
     Project, boot + HANDOFF from `session.checkpoint` (no logs) +
     workspace_info, then `c2c session set --url` only after the name matches.
     long-chat → Conversation management switch, same checks. Keep the old
     saved URL until the new chat passes.
5. If the ChatGPT conversation was lost: same as the failure path in step 4.
   No workspace file uploads; use authorized commit/RDC evidence routes. If tools point at
   the wrong connector, open 项目设置 and confirm 指令 still names
   `connectorName` (never paste the new public address).

## Workflow: repair（diagnosed connection fault）

1. Preserve failure evidence and investigate the cause; use `c2c doctor --no-fix -w <workspace> --json` for a suspected local connection fault only within authorization for runtime reads and possible endpoint persistence, as described above. For strictly read-only inspection without runtime or credential access, use source and nonsecret repository metadata. Run repairing Doctor only for a diagnosed, authorized recovery. Doctor gate: do not open ChatGPT / send
   `[C2C]` until local is green, except reconnect settings pages.
2. If `namedRepair.needed`, tell the user `namedRepair.userMessage`; satisfy rule 5’s browser-consent condition before
   `c2c tunnel login --json`, then doctor again. Do not Delete the connector.
3. If `chatgptRepair.needed`, follow **reconnect after address reclaim**, then
   doctor again.
4. Otherwise apply the diagnosed recovery map. Personal consent, login / 2FA /
   CAPTCHA and guided manual choices retain their existing boundaries — one action.

## Recovery map

| Symptom | Action |
| --- | --- |
| Bridge not running | `c2c start` (doctor does this automatically) |
| Tunnel dead / URL unreachable / 全关掉后连接失效 | `c2c doctor` → if `namedRepair.needed`, login to Cloudflare and doctor again (do not Delete). If `chatgptRepair.needed`, tell the user the message, then **Delete** THIS workspace's connector only (`connectorName`) and create it again. Never Reconnect. After recreate, re-check `workspace_info` in the saved chat; if it still fails, new chat in the same Project (or long-chat switch) + HANDOFF. |
| Collection page shows only Retry | Same iab tab: Retry once, then open the last working chat and click its Project link. Do not write INIT/EXECUTED waiting checkpoints until the message is visible. |
| ChatGPT says tool call failed / 401 | token expired or revoked → re-pair (new pairing code + authorize) |
| Pairing code rejected/expired | `c2c pair --json` for a fresh code |
| Same explicit ChatGPT setup/reconnect browser configuration step fails twice after repair | Stop automating ChatGPT settings and use **Guided manual ChatGPT setup fallback**. Do not count browser/js timeout, loading/generating, or login/2FA waiting as failures. |
| Port conflict | handled automatically; never surface to the user |
| Every new chat “repairs” / cannot write the log or settings directory | Diagnose the write failure; `c2c sandbox-allow --json` changes permission configuration and requires existing authority plus the formal platform gate. A policy cleanup does not authorize it. |
| cloudflared missing | install it yourself (brew/winget), then retry |
| Sidebar has no「项目」 | Ask the user to hover「聊天」, click the …, choose「按项目整理」 |
| Collection page is the wrong Project | Ask the user to open the named collection and say「已找到」, or accept long-chat |

## Local installation note
Preserve the installation's existing launcher and local networking configuration.
Keep machine-specific paths and account configuration in a local overlay outside
this public source tree. Do not bypass a configured launcher with direct Node
invocation when starting/restarting the bridge. A policy update does not authorize
changes to DNS, TLS verification, tunnel settings or launcher behavior.
