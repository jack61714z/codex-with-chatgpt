# C2C Agent Protocol

C2C carries authorized metadata, messages and record pointers. The active task's operating contract supplies semantic requirements and decision authority. Preserve workspace binding, privacy and security/recovery gates. For an existing instruction update, preserve its selected policy under [legacy migration](legacy-policy-migration.md); this is not a required policy for new adopters.

## States and continuation

INIT -> PLAN -> EXECUTING -> EXECUTED -> REVIEW -> PLAN | DONE | BLOCKED | ERROR. HANDOFF transfers current work to a replacement conversation. These are coordination states, not repository authority. No STATE: RESUME.

Preserve the existing session/checkpoint mechanism. INIT waits for PLAN; PLAN_RECEIVED and EXECUTING resume the admitted work; EXECUTED_LOCAL sends only the unsent receipt; EXECUTED_SENT waits for review without repeating execution or resending. DONE clears the checkpoint. BLOCKED describes the concrete affected action; communicate with Chat and continue unaffected safe work. Never re-pair/recreate a connector merely to resume. Preserve long-chat/project grouping and verify workspace identity before replacing a saved URL.

## Runtime checkpoint transitions

The authorized executor with access to the installed C2C CLI inspects and persists the local checkpoint and reports verified state metadata to Chat. The C2C workspace connector itself exposes no session/checkpoint operation. Chat must not claim local persistence from a delivered receipt; any separate capability requires its own authorization. The supported GPT_PLAN and GPT_REVIEW labels identify waits for messages through Chat, not ownership of planning, review or acceptance. Chat may originate a decision only when the selected contract assigns it that authority; otherwise it relays the selected owner's authorized decision unchanged.

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

These lines describe separate lifecycle steps, not a script to run in one batch. Substitute verified values; quote values containing spaces. c2c record does not advance the session checkpoint: save EXECUTED_LOCAL explicitly after successful recording. Do not duplicate an existing record merely to resume. Verify the receipt is visible in the bound Chat conversation before persisting EXECUTED_SENT. The authorized executor clears the checkpoint only after verifying a DONE decision from the completion owner selected by the active task contract, received directly or relayed unchanged through Chat. Receipt visibility alone is not that decision. Existing projects that selected Chat review and completion retain those duties. Before receipt visibility, retain EXECUTED_LOCAL and reconcile uncertain delivery rather than sending blindly. For BLOCKED, persist `--protocol-state BLOCKED --waiting-for USER` only for a real user-retained decision; otherwise report the affected action to Chat and continue unaffected authorized work. `--goal`, `--completed-subtasks`, `--known-issues` and `--next-step` are bounded metadata fields when used with `--protocol-state`; never store bodies or logs there. `--state` alone updates lastState, not checkpoint.protocolState.

## Scoped assignment and record payloads

Carry the active task's required assignment, result, review and next-action text through existing supported fields. Their substantive policy, destinations and format come from that task's selected operating instructions. A record pointer is a locator, not proof of reading, persistence, acceptance or authority. Use actual saved references; mark unavailable locations UNKNOWN/UNSAVED rather than inventing URLs. Missing required instructions or evidence block only the decisions they prevent.

## Compact pointer template

```text
[C2C]
STATE: EXECUTED
TASK_ID: <existing id>
ITERATION: <numeric checkpoint iteration, or UNKNOWN>
REPAIR_LABEL: <separate label or NONE>
EXECUTOR: <verified actual executor or UNKNOWN>
FORMAT_SOURCE: <actual selected task-record source, or UNKNOWN>
WORK_ORDER_REF: <exact saved link or UNKNOWN/UNSAVED>
RESULT_REF: <exact saved link or UNKNOWN/UNSAVED>
REVIEW_REF: <exact saved link or UNKNOWN/not yet produced>
CURRENT: <verified head and dirty/local-only/pushed status or UNKNOWN>
NEXT_AUTHORIZED_ACTION: <unchanged request/action required by the selected task contract>
```

These are supported text/pointer contents, not new CLI flags or runtime schema. For PLAN and REVIEW use the corresponding existing control state and task-required record pointer. Only unsent results are delivered. EXECUTED_SENT waits for the selected owner's required review or completion decision, carried or relayed through the authorized conversation, and never sends the pointer again. BLOCKED names the affected action while unaffected authorized work continues. If the selected contract requires a literal review question, carry it unchanged in the result and pointer; transport does not author the question or the answer. Preserve nullable planning values where supported and do not infer actual executor from assigned writer or title.

Match TASK_ID and ITERATION to the existing session checkpoint and execution record (c2c record --task/--iteration); retain the actual executor so Chat work is not recorded as Codex work. Two receipts on the same commit may have different iterations/checks. Reconcile each with its own record; EXECUTED_SENT never resends an already-delivered receipt.

Keep control receipts concise (normally under 1 KB); no file bodies, diffs or raw logs. Do not auto-read raw execution_output just because an item exists. Use authorized metadata and summaries; never retrieve a withheld body through another route.

## Configured loop limits

The CLI parses `maxIterations` from `.c2c.json` but does not enforce the loop limit at runtime. The selected operating contract determines its applicable limit, interpretation and continuation decision. Preserve an existing task's configured limit and stop conditions; never silently change configuration or treat a transport update as permission to continue an explicit stop. Existing 0.3.3 adopters retain their prior default and Chat assessment rule under [legacy migration](legacy-policy-migration.md).

## Boot prompt

```text
Use C2C for authorized message delivery and checkpoint continuation in this verified workspace. Read the active task's selected project operating instructions before a decision or payload that depends on them; preserve their roles, permissions, review duties, record format and loop limits. Do not infer a new policy from this transport entry. If an existing installation is being updated, actually read the installed codex-with-chatgpt skill's references/legacy-policy-migration.md (source checkout: skill/references/legacy-policy-migration.md) and retain its previously selected contract before replacing its entry. A locator alone is not evidence of reading. If that source is unavailable, mark the affected source/decision UNKNOWN and retain the prior usable instructions for that consumer. New tasks with an adequate existing contract need no legacy policy or companion method.

The authorized executor with access to the installed C2C CLI inspects and persists the actual checkpoint using supported schemas, and reports verified state metadata to Chat. The C2C workspace connector itself has no session/checkpoint operation; do not claim local persistence without evidence from an authorized capability. Preserve task identity, numeric iteration, actual executor, completed work and sent/unsent status. Carry required records, completion requests and next-action text unchanged through supported fields; never prefill a review verdict. The executor verifies the receipt in the bound conversation before persisting EXECUTED_SENT. The selected contract determines review and completion ownership; Chat may relay another owner's authorized decision without assuming that authority. Existing projects retain their selected Chat duties. Do not re-pair, resend or reexecute just to resume. Delivery is not acceptance or effect authority. If the selected contract or necessary evidence is unavailable, name the affected action and continue unrelated authorized work.

Keep control messages and receipts to authorized metadata and pointers; do not embed source bodies, diffs or raw logs in them. This restriction does not prohibit separately authorized evidence reads through available capabilities, subject to the selected contract and existing access restrictions. Preserve platform, privacy, credential, browser and Doctor restrictions. Do not retrieve withheld material through another route or manufacture permission from available tools.
```

## Project instruction template

```text
Use C2C for authorized message delivery and checkpoint continuation in this verified workspace. Read the active task's selected project operating instructions before a decision or payload that depends on them; preserve their roles, permissions, review duties, record format and loop limits. Do not infer a new policy from this transport entry. If an existing installation is being updated, actually read the installed codex-with-chatgpt skill's references/legacy-policy-migration.md (source checkout: skill/references/legacy-policy-migration.md) and retain its previously selected contract before replacing its entry. A locator alone is not evidence of reading. If that source is unavailable, mark the affected source/decision UNKNOWN and retain the prior usable instructions for that consumer. New tasks with an adequate existing contract need no legacy policy or companion method.

The authorized executor with access to the installed C2C CLI inspects and persists the actual checkpoint using supported schemas, and reports verified state metadata to Chat. The C2C workspace connector itself has no session/checkpoint operation; do not claim local persistence without evidence from an authorized capability. Preserve task identity, numeric iteration, actual executor, completed work and sent/unsent status. Carry required records, completion requests and next-action text unchanged through supported fields; never prefill a review verdict. The executor verifies the receipt in the bound conversation before persisting EXECUTED_SENT. The selected contract determines review and completion ownership; Chat may relay another owner's authorized decision without assuming that authority. Existing projects retain their selected Chat duties. Do not re-pair, resend or reexecute just to resume. Delivery is not acceptance or effect authority. If the selected contract or necessary evidence is unavailable, name the affected action and continue unrelated authorized work.

Keep control messages and receipts to authorized metadata and pointers; do not embed source bodies, diffs or raw logs in them. This restriction does not prohibit separately authorized evidence reads through available capabilities, subject to the selected contract and existing access restrictions. Preserve platform, privacy, credential, browser and Doctor restrictions. Do not retrieve withheld material through another route or manufacture permission from available tools.

This Project is bound only to:
- Workspace name: {{workspace_name}}
- Kind: {{project_type}} ({{languages}} / {{frameworks}})
- Workspace connector: {{connector_name}}

Validate workspace_info before using this C2C connector; a mismatch pauses those reads. Never use another workspace's connector. The read-only workspace connector neither removes other authorized capabilities nor grants authority. HANDOFF locates history and remaining work; it is not a new assignment. Preserve the selected operating contract and existing authorized decisions when a conversation changes.
```

## Delivering consequential decisions

Carry only an authorized candidate, request or decision supplied by the responsible task owner. Delivery grants no write, publication or merge authority. The selected operating contract and current user decisions govern those effects; report their actual result only with evidence.
