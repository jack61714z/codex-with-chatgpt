# C2C maintenance

Use only for a requested update/install, not at every task. Read-only update discovery does not authorize installation or bridge churn.

Inspect the checkout's status, local commits and remote first. Save the previous source tree before changing the checkout, and back up the installed skill. Never stash, reset or discard user edits automatically. Use the explicitly authorized owning repository as the source for future updates. Reconcile installation-specific overlays locally through Chat; do not push private overlays to any repository. A clean compatible upstream update may use git pull --ff-only, followed by pnpm install/build when needed.

The repository's install/update workflow uses the complete-directory helper below to install skill/, including references and templates when present, into <codex-home>/skills/codex-with-chatgpt/. Resolve <codex-home> from nonempty CODEX_HOME or ~/.codex. Replace <ACTUAL_CHECKOUT_PATH> in the installed connection reference with the actual checkout path. Back up the existing install, preserve its machine-specific Local installation note in the connection reference, and verify copied files before a fresh host-load check. The existing installation-specific launcher remains authoritative for bridge start/restart; generic direct-Node examples must not override it. Keep personal paths and account configuration in a local overlay outside the public source tree. Do not modify that launcher or its networking/security settings as part of a policy update. Do not create another same-name plugin. Use the supported marketplace interface for managed plugins; do not hand-edit plugin caches.

If an install/configuration write was safety-denied, do not replay it by another tool or agent. Preserve exact rejection evidence and seek supported formal clearance; keep candidates separate from active paths. Do not alter sandbox/trust as a workaround. Restart a bridge only when the actual runtime update requires it and current Doctor evidence permits it; no connector recreation just to load instructions.

After permitted installation, test actual host loading and side-effect-free behavior separately from static comparison. Existing sessions may retain snapshots. Report which host loaded what; do not call saved files or matching hashes activation.

## Complete text installation and safe update

For every requested local skill install/update, use the checkout's complete-directory helper after the authorized checkout update/build. Run it from the checkout root; a version check alone never runs installation:

```sh
node scripts/install-skill.mjs ./skill <codex-home>/skills/codex-with-chatgpt <saved-previous-source-skill>
```

For a new installation omit the last argument. For an existing install pass the saved previous source tree; if no trustworthy base exists, the helper reports overlapping customized files rather than replacing them. Save the previous source tree before changing the checkout; it is the three-way comparison base, not a claimed current host snapshot. The helper copies all skill Markdown/JSON files recursively, including references and templates when present, resolves the connection checkout placeholder, reads back writes and reports a recovery backup path. It preserves extra destination text files and customized files when the incoming source is unchanged. Overlapping customization produces a concrete conflict and leaves the entire installation untouched; reconcile only authorized text before retrying. It rejects symlinks and non-text content. It does not delete unrelated skills, copy Chat plugin manifests, change credentials/configuration, start services or establish persistent access.

Read full-format.md after installation and verify its SHA256 against the approved source. Record source and installed paths, format/package versions, digests and readback; actual fresh host loading and decision behavior are separate checks. If unavailable, mark those UNKNOWN. Do not operate a denied host or send instructions to another agent merely to prove loading.

The installer preflights customization conflicts, but file writes are not transactional. An I/O/readback failure after writes begin can leave a partial installation and can throw before returning its automatic backup path. Before running it, retain a complete destination recovery copy at a known path in addition to the previous-source baseline. On failure, stop without a blind retry, preserve the error, compare current destination files with that recovery copy, and reconcile only the affected files through Chat. An authorized manual rollback must preserve any later edits; do not reset the checkout or overwrite private overlays to match public source metadata.
