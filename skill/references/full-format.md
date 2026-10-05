# Canonical full work-order / result / review format

FORMAT_VERSION: 1.0.1
PACKAGE_VERSION: 0.3.3

This is the single canonical contract for both Chat and Codex. Read it together with [the shared policy](collaboration-policy.md). All three full records use the common binding below. The Markdown field names are a document contract, not new C2C CLI flags, runtime schema fields, protocol states, cursors, epochs, or an additional review phase. Preserve the installed implementation's actual schema; use supported text/pointer fields for these records.

## Binding and durable location

Full WORK_ORDER, EXECUTION_RESULT, and CHAT_REVIEW records belong on the authorized owning GitHub work item (issue or PR), with exact comment links once actually saved. Use only the user-authorized repository/audience and sanitized task evidence, never private policies, source bodies, credentials, or raw logs. If publication is not authorized or unavailable, prepare the full record in the existing authorized conversation, mark its durable link UNKNOWN, and report that limited delivery gap. Do not invent a comment URL or block unrelated work.

Each record binds FORMAT_VERSION and FORMAT_SOURCE to the package version, canonical path, and verified content hash from approved-source.json (or an actually-read installed source). State UNKNOWN if source identity cannot be verified. A link alone is a locator, not proof of reading; SOURCE_READ records the exact revision/sections actually inspected. No cached-session automatic activation is implied.

Common fields (repeat in every full record):

```text
RECORD: <WORK_ORDER | EXECUTION_RESULT | CHAT_REVIEW>
FORMAT_VERSION: 1.0.1
FORMAT_SOURCE: <package/version; canonical path; verified sha256, or UNKNOWN with reason>
TASK_ID: <existing task id>
ITERATION: <numeric existing checkpoint iteration; UNKNOWN if unavailable>
REPAIR_LABEL: <separate label such as R3, or NONE; never substitute for ITERATION>
REPOSITORY: <verified owner/repository or UNKNOWN>
WORK_ITEM: <owning issue/PR URL or UNKNOWN>
WORK_ORDER_REF: <exact full work-order link or UNSAVED/UNKNOWN>
RESULT_REF: <exact full result link or UNSAVED/UNKNOWN/not yet produced>
REVIEW_REF: <exact full Chat review link or UNSAVED/UNKNOWN/not yet produced>
EXECUTOR: <verified actual executor; UNKNOWN if execution identity is not verified>
EXECUTOR_EVIDENCE: <record or host evidence actually read; not intended owner or title>
ASSIGNED_WRITER: Codex.app
PLAN_HEAD: <verified SHA at planning, or null with reason>
BASELINE: <original requirement source/revision and cumulative comparison base; UNKNOWN parts explicit>
CURRENT: <verified candidate head/revision or UNKNOWN; dirty/local-only/pushed status>
SOURCE_READ: <each actual source/revision/section read; distinguish supplied excerpts, summaries, and unread locators>
```

PLAN_HEAD may be null when planning precedes a verified checkout. That is not authority to invent a head or reject useful planning. Later results bind the actual candidate if verified. Do not infer actual EXECUTOR from ASSIGNED_WRITER, a skill title, or a claimed report author. Bind all decisions to their evidence revision; a new head requires reassessment of affected claims.

## 1. Chat WORK_ORDER

Fill the common fields, then all slots below. A concise populated full record is preferable to an unbounded pasted conversation.

```text
ORIGINAL_GOAL: <user outcome, source, and unchanged success criteria>
CURRENT_PROBLEM: <observed behavior and evidence; separate hypotheses>
INVARIANTS: <contracts and behavior to preserve>
SCOPE:
  IN: <allowed paths/components and bounded effects>
  OUT: <excluded changes and retained human decisions>
  RELATED_CONTEXT: <callers/interfaces/state/lifecycle/dependencies that need inspection>
OWNERSHIP_AND_AUTHORITY:
  CHAT: <planning/investigation/review and separately authorized record publication>
  CODEX: <single-writer edit/test/fix/verification scope>
  EFFECTS: <explicit authority for local edits, commit, push, PR, publication, merge, etc.; unknowns stay unknown>
  AUTHORITY_SOURCE: <current user delegation/decision, not the work-item comment itself>
IMPLEMENTATION_REQUEST: <concrete outcome and constraints; preserve valid completed work>
VERIFICATION:
  REQUIREMENT_TO_CHECK: <requirements/invariants mapped to actual checks and expected observations>
  SYSTEM_CONTEXT: <proportionate affected caller/interface/state/lifecycle/runtime/security checks>
  EVIDENCE_NEEDED: <authorized commit/path/check sources; limitations to disclose>
COMPLETION_CONDITION: <behavior, scope, evidence, and remaining-risk disposition>
REQUIRED_RETURN: <full EXECUTION_RESULT; explicit OVERALL_DRIFT_REVIEW_REQUEST; compact pointer to Chat>
NEXT_AUTHORIZED_ACTION: <owner and concrete next step within current delegation>
```

An accepted scoped order covers routine investigation/edit/test/fix/verification without another human signature. Do not restart interviews or completed execution. Ask Chat about a real missing scope/authority choice while continuing unaffected authorized work. Work-item persistence does not expand scope, approve merge, clear a denial, or create live authority.

## 2. Codex EXECUTION_RESULT

Fill common fields and every result slot, even if an affected part is incomplete. State unknown or not performed rather than inventing evidence. Codex MUST actively ask Chat the literal question below, both in the full result and as the next-action request in the compact C2C pointer.

```text
WORK_PERFORMED: <actual changes; relative paths and requirement mapping>
CUMULATIVE_CHANGE: <original baseline through current candidate, including retained earlier iterations>
INVARIANT_IMPACT: <observed effects on original contracts and system context; mistaken assumption corrected or still present; same-root sibling paths checked and their outcomes; inspected boundary and uninspected areas; evidence and uncertainty>
CHECKS: <actual command/check, revision, result, relevant failure names, and limitations; for important counterexamples: precondition, required expected behavior, actual behavior, and evidence that the fixture really constructs the claimed condition rather than merely naming it>
FINDINGS_AND_DISPOSITION: <finding id/source; fixed/accepted-with-authority/deferred-with-authority/rejected-with-evidence/unknown; rationale and evidence; before assigning repair, compare current main/candidate and successor fixes; distinguish tracking ownership from evidence of an actual remaining defect>
PUBLICATION_STATE: <uncommitted/local-only/pushed-readback; real commit/PR links and actual readback>
REMAINING_RISKS: <known deviations, missing evidence, and affected decisions; separately give evidence and pending items for implementation completion, Chat review, external review when required by the existing workflow, and merge eligibility when relevant; otherwise state not applicable and why>
OVERALL_DRIFT_REVIEW_REQUEST:
  QUESTION: Chat，請依原始目標與累積變更實際審查：是否造成整體飄移？
  REVIEW_BASELINE: <original user goal/invariants plus cumulative base, not only the last repair>
  REVIEW_CURRENT: <current exact candidate and related context>
  REQUIRED_RESPONSE: <Chat's full CHAT_REVIEW with evidence-backed per-axis verdicts and required actions>
NEXT_AUTHORIZED_ACTION: <send unsent result/pointer to bound Chat; or wait for that review if already sent>
```

Implementation completion, Chat review, applicable external review and merge eligibility are separate evidence claims; one PASS cannot cover them all. This separation adds no protocol state, review requirement or approval gate.

The question means “Chat, please actually review the original goal and cumulative changes: has this caused overall drift?” Preserve the exact Chinese QUESTION string even when surrounding prose is another language. Codex supplies its findings, not Chat's answer: it cannot prefill Chat PASS or substitute DRIFT_CHECK=true. The request is part of existing completion/review, not a new external reviewer gate.

## 3. Chat CHAT_REVIEW

Chat MUST answer the question after reading the original requirement/baseline, actual cumulative changes, and necessary affected context through authorized sources. If a required source is unavailable, still produce an honest review of supported claims and mark the affected axis/decision UNKNOWN. A receipt, hash, old review or test summary is not a substitute for actually reading changes and context. Supplied excerpts can support bounded findings; label them as excerpts, and do not claim repository inspection or operational testing.

Fill common fields, then the review slots. Write a substantive verdict in each axis row rather than copying the question or asserting an overall boolean.

```text
OVERALL_DRIFT_VERDICT: <NO_DRIFT_SUPPORTED | DRIFT_FOUND | UNKNOWN>
DIRECT_ANSWER: <yes/no/unknown with the principal reason and evidence boundary>
REVIEWED_RANGE: <original requirement/baseline -> current candidate; cumulative, not latest-patch-only>
AXIS_REVIEWS:
  - AXIS: original_goal
    STATUS: <ASSESSED | NOT_APPLICABLE | UNKNOWN>
    BASELINE: <required outcome/invariant and exact source>
    CURRENT: <actual observed candidate behavior and exact source>
    SOURCE_READ: <revision/path/section actually inspected or missing>
    VERDICT: <ALIGNED | DRIFT | UNKNOWN | NOT_APPLICABLE>
    REASON: <comparison; justify every NOT_APPLICABLE or UNKNOWN>
    DEVIATIONS: <specific deviations or NONE supported by evidence>
    REQUIRED_ACTION: <concrete action/owner; NONE only with rationale>
  - AXIS: scope
    <repeat all fields above>
  - AXIS: interfaces
    <repeat all fields above; producers, consumers, callers, compatibility>
  - AXIS: architecture
    <repeat all fields above; boundaries, coupling, state and lifecycle>
  - AXIS: workflow_ownership
    <repeat all fields above; single writer, order, authority and handoffs>
  - AXIS: runtime_data_security
    <repeat all fields above; runtime behavior, state/data/persistence, privacy/security implications>
  - AXIS: related_dependencies
    <repeat all fields above; affected upstream/downstream or configuration prerequisites>
REQUIREMENT_COVERAGE: <each important requirement -> implementation/evidence/check; omissions explicit>
FINDING_DISPOSITIONS: <each relevant finding with source, severity/impact, resolution/authority, evidence and required action; before returning repair, compare current main/candidate and successor fixes; distinguish tracking ownership from evidence of an actual remaining defect>
EVIDENCE_LIMITS: <not read/not tested/unknown; which decision each prevents; separately give evidence and pending items for implementation completion, this Chat review, external review when required by the existing workflow, and merge eligibility when relevant; otherwise state not applicable and why>
DECISION: <accept scoped result | return scoped repair | request specific evidence | seek retained human decision>
NEXT_AUTHORIZED_ACTION: <concrete owner/action within scope; preserve valid work>
MERGE_DISPOSITION: <not requested/not authorized; or exact reviewed PR/head, approval source and explicitly assigned merge executor>
```

Every axis must be present. NOT_APPLICABLE requires an evidence-backed reason; UNKNOWN identifies the missing evidence and the affected decision. “No relevant changes” needs inspected scope/dependency evidence. If any supported material drift exists, use DRIFT_FOUND even when other axes are unknown. NO_DRIFT_SUPPORTED requires every relevant axis supported by read evidence and no unresolved applicable unknown/deviation; it describes the reviewed range only, not universal system safety.

Assess original-goal -> implementation/check coverage and change -> requirement justification in both directions. Review cumulative drift from the original goal even after a sequence of small green repairs. Inspect actual callers, interfaces, state transitions, lifecycle, architecture and authority where affected; do not just restate tests. Scope unknowns to the decision they affect instead of freezing all work.

A finding marked rejected needs counterevidence; fixed needs evidence at the reviewed candidate; accepted/deferred needs the relevant decision authority. Silence, unresolved-thread count, a durable comment, or an old snapshot alone is not a disposition. A changed head invalidates exact-head merge approval until renewed review and approval; routine accepted repairs still do not need another human approval.

## Short example: green checks with contract drift

Original work order preserves GET response `{status}`; current cumulative producer change returns `{state}`, while the actually-read caller still uses `.status`. Forty green tests and a latest comments-only diff do not repair that mismatch. Codex returns those facts and the literal OVERALL_DRIFT_REVIEW_REQUEST. Chat marks original_goal/interfaces DRIFT with baseline and producer/caller sources, other axes assessed or explicitly unknown, requires restoring the authorized contract, and returns the already accepted scoped repair to Codex.app. It neither pre-approves merge nor asks the user to reapprove the same repair.
