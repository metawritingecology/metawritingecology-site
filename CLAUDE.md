@AGENTS.md

# Claude Code Instructions

Claude Code is the routine engineering layer for this repository.

Implement only the requested technical task.

Do not make MWE authority-level decisions.

Do not rewrite conceptual text unless the user explicitly provides replacement text.

Do not change navigation, route structure, public positioning, or boundary statements unless explicitly instructed.

If a task requires naming, classification, public/private judgment, relation confirmation, OSF judgment, or conceptual architecture decisions, stop and ask for user review.

## Symbol hygiene

Follow the canonical symbol hygiene rule in `AGENTS.md`.

Operational reminder:
- prose/content: use `≠`
- code/operators: preserve `!=` and `!==`
- before committing prose edits, scan touched content files for literal `!=`

## Worklog Governance

Follow the canonical worklog governance, pre-append inventory gate, historical-entry protection, and rollover policy in `AGENTS.md`. `AGENT_WORKLOG.md` is the only active append target; archived logs, when present, are immutable historical evidence and must not be edited.

Before finishing, report:
- files changed
- what was implemented
- tests or build checks run
- unresolved questions
- boundary-sensitive areas
