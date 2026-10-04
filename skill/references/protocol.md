# C2C Agent Protocol

Follow [the shared policy](collaboration-policy.md). Control messages carry metadata; file evidence uses authorized pushed commits, with authorized RDC for exact local context. Preserve workspace binding and security/recovery gates.

## States and continuation

INIT -> PLAN -> EXECUTING -> EXECUTED -> REVIEW -> PLAN | DONE | BLOCKED | ERROR. HANDOFF transfers current work to a replacement conversation. These are coordination states, not repository authority. No STATE: RESUME.

Preserve the existing session/checkpoint mechanism. INIT waits for PLAN; PLAN_RECEIVED and EXECUTING resume the admitted work; EXECUTED_LOCAL sends only the unsent receipt; EXECUTED_SENT waits for review without repeating execution or resending. DONE clears the checkpoint. BLOCKED describes the concrete affected action; communicate with Chat and continue unaffected safe work. Never re-pair/recreate a connector merely to resume. Preserve long-chat/project grouping and verify workspace identity before replacing a saved URL.

## Runtime checkpoint transitions

Inspect `c2c session -w <ws> --json` before any INIT and resume its `session.checkpoint`. Reuse its task ID, numeric iteration and bound conversation. EXECUTED_LOCAL sends only the unsent receipt; EXECUTED_SENT waits for review without resending. A missing conversation uses HANDOFF from checkpoint metadata; it does not repeat completed work.

Only a genuinely new task sends INIT. Verify that INIT is visible in the bound conversation, then persist INIT/GPT_PLAN. After receiving and accepting PLAN, persist PLAN_RECEIVED; before implementation, persist EXECUTING. For the same task/iteration, the supported commands are:

```sh
c2c session set -w <ws> --task <id> --iteration <n> --protocol-state INIT --waiting-for GPT_PLAN --goal <goal>
c2c session set -w <ws> --task <id> --iteration <n> --protocol-state PLAN_RECEIVED --waiting-for none
c2c session set -w <ws> --task <id> --iteration <n> --protocol-state EXECUTING --waiting-for none
c2c record -w <ws> --task <id> --iteration <n> --changed-files <paths> --tests <summary> --exit-status <status> --executor <executor>
c2c session set -w <ws> --task <id> --iteration <n> --state EXECUTED --protocol-state EXECUTED_LOCAL --waiting-for none
c2c session set -w <ws> --task <id> --iteration <n> --protocol-state EXECUTED_SENT --waiting-for GPT_REVIEW
c2c session set -w <ws> --task <id> --iteration <n> --state DONE --clear-checkpoint
```

These lines describe separate lifecycle steps, not a script to run in one batch. Substitute verified values; quote values containing spaces. c2c record does not advance the session checkpoint: save EXECUTED_LOCAL explicitly after successful recording. Do not duplicate an existing record merely to resume. Verify the receipt is visible in the bound Chat conversation before persisting EXECUTED_SENT. Only Chat's DONE decision clears the checkpoint. Before receipt visibility, retain EXECUTED_LOCAL and reconcile uncertain delivery rather than sending blindly. For BLOCKED, persist `--protocol-state BLOCKED --waiting-for USER` only for a real user-retained decision; otherwise report the affected action to Chat and continue unaffected authorized work. `--goal`, `--completed-subtasks`, `--known-issues` and `--next-step` are bounded metadata fields when used with `--protocol-state`; never store bodies or logs there. `--state` alone updates lastState, not checkpoint.protocolState.

## Scoped assignment and full records

Chat investigates, plans and reviews; Codex.app is the daily single repository writer. A direct user assignment may explicitly select a different actual executor for this task only. PLAN binds original goal, scope, effects and checks through a full [WORK_ORDER](full-format.md). Use the same canonical contract for EXECUTION_RESULT and CHAT_REVIEW; it is a document contract, not CLI/schema/state changes.

Full sanitized records use the verified authorized owning GitHub work item and exact saved comment URLs. If no destination or publication authority is verified, prepare the full record in the existing authorized conversation, mark its durable link UNKNOWN, and report that limited delivery gap. Local evidence may supplement that conversation record; it is not a prerequisite. Do not invent URLs. Chat must read original requirements, cumulative actual changes and affected context, then answer all seven axes with substantive evidence. Tests alone do not establish acceptance.

## Compact pointer template

```text
[C2C]
STATE: EXECUTED
TASK_ID: <existing id>
ITERATION: <numeric checkpoint iteration, or UNKNOWN>
REPAIR_LABEL: <separate label or NONE>
EXECUTOR: <verified actual executor or UNKNOWN>
FORMAT_SOURCE: <0.3.2; references/full-format.md; verified sha256 or UNKNOWN>
WORK_ORDER_REF: <exact saved link or UNKNOWN/UNSAVED>
RESULT_REF: <exact saved link or UNKNOWN/UNSAVED; local full record location>
REVIEW_REF: <exact saved link or UNKNOWN/not yet produced>
CURRENT: <verified head and dirty/local-only/pushed status or UNKNOWN>
NEXT_AUTHORIZED_ACTION: Chat，請依原始目標與累積變更實際審查：是否造成整體飄移？
```

For PLAN and REVIEW use the corresponding existing control state and full-record pointer; only an unsent EXECUTED result requests the question above. EXECUTED_SENT waits for Chat review and never sends the pointer again. BLOCKED names the affected action while unaffected authorized work continues. PLAN_HEAD may be null before checkout verification. Do not infer EXECUTOR from ASSIGNED_WRITER or title.

Match TASK_ID and ITERATION to the existing session checkpoint and execution record (c2c record --task/--iteration); retain the actual executor so Chat work is not recorded as Codex work. Two receipts on the same commit may have different iterations/checks. Reconcile each with its own record; EXECUTED_SENT never resends an already-delivered receipt.

Keep control receipts concise (normally under 1 KB); no file bodies, diffs or raw logs. Chat reads actual committed changes plus necessary impacted context, checks change->requirement and requirement->implementation/verification, and returns a substantive next decision. Do not auto-read raw execution_output just because an item exists. Use metadata and summaries; necessary sanitized evidence must be authorized and never retrieve withheld bodies through another route.

Read `maxIterations` from the workspace's `.c2c.json`; when absent, use the workflow default of 12 iterations for a fresh installation. The CLI parses this setting but does not enforce the loop limit at runtime; the assigned writer checks the current checkpoint iteration before starting another iteration. An invalid configured limit goes to Chat for assessment rather than silently changing configuration. At the limit, pause further implementation and return progress, unresolved issues and loop evidence to Chat for a progress/loop assessment. Chat decides scoped continuation or a changed strategy within existing authority; this is not a new user signature for routine continuation. The limit does not authorize changing unrelated configuration or continuing an explicit stop. New scope/destructive/disclosure/consent and merge boundaries go through Chat to the user.

Use the approved task pipeline in the shared policy for first-failure investigation, existing applicable final-wave caps and no-blind-retry limits and narrow Ponytail methods.

## Boot prompt

```text
You coordinate this scoped task under the shared Chat / Codex collaboration policy. Chat investigates, plans and reviews; Codex.app is the daily single repository writer. Direct user assignments to Codex remain valid. Check workspace identity before C2C reads and consider other authorized GitHub/RDC capabilities.

Use committed versioned evidence and necessary context to review original requirements in both directions, including affected system behavior. C2C receipts are claims, not acceptance. Do not request workspace uploads or raw logs. A scoped Chat decision can cover a complete edit/test/fix cycle without repeated user ratification. Keep one writer and resume completed work without repeating it. Route real user-retained decisions through Chat; no platform restriction is waived.

Use the canonical full WORK_ORDER, EXECUTION_RESULT and CHAT_REVIEW contract, format 1.0.1 / package 0.3.2, at the installed codex-with-chatgpt skill's references/full-format.md (source checkout: skill/references/full-format.md), together with references/collaboration-policy.md. Actually read the bound source; a locator alone is not evidence. If unavailable, mark that source/decision UNKNOWN and request the authorized contract from Chat without uploading workspace files. Save durable GitHub records only when destination and publication are authorized; otherwise prepare the full record in the existing authorized conversation, mark its durable link UNKNOWN, and report that limited delivery gap. Local evidence may supplement that conversation record; it is not a prerequisite.

Chat must read the original goal, cumulative actual changes and affected context and substantively assess all seven axes: original_goal, scope, interfaces, architecture, workflow_ownership, runtime_data_security, related_dependencies. Codex completion asks exactly: Chat，請依原始目標與累積變更實際審查：是否造成整體飄移？ Green tests and receipts alone do not establish acceptance.

Reuse completed bound clarity/interviews. At the first meaningful failure invoke Progressive Investigation, preserve evidence and identify the supported cause to sufficient depth without treating the first plausible cause as proven; a new attempt needs new evidence and a changed strategy, never an identical blind retry. Ponytail simplification/debug/testing stays a narrow method, including its requested-report exception. Preserve real permission/security boundaries and existing applicable final-wave caps; these are not universal caps for every first error.

Reply with concise C2C decisions, scope, completion condition and needed evidence. Merge candidate -> Chat cumulative review -> user exact PR/head approval -> explicitly assigned merge executor -> readback.
```

## Project instruction template

```text
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

## Merge

Chat reviews the original goal, cumulative candidate changes and affected context before asking the user about the exact PR/head. Merge needs both that approval and an explicitly assigned executor; read back the result. A changed head invalidates approval until renewed review/approval. Available tools alone assign no executor.
