# Agent Rules for the Meta-Writing Ecology Website Repository

This repository is a public-facing website surface for Meta-Writing Ecology (MWE).

It does not represent the full MWE archive, internal registry, backend corpus, complete methodology, or authority layer.

Agents may perform approved technical work only.

## Role Allocation

### GPT Conversation
Use GPT conversation for:
- structural reasoning
- conceptual boundary judgment
- public/private boundary review
- naming judgment
- OSF / GitHub / website positioning
- deciding whether a page should exist
- deciding whether navigation prominence is appropriate
- deciding whether wording changes alter MWE meaning

### Claude Code
Use Claude Code for routine engineering:
- Astro implementation
- page or component creation after approval
- CSS, layout, and interaction work
- D3 / Canvas / Three.js prototypes from prepared public data
- JSON / CSV transformation
- local scripts
- import, route, build, and component fixes
- small repo-local edits

Claude Code must not decide:
- MWE model classification
- OSF priority
- public/private status
- naming authority
- registry confirmation
- candidate relation validity
- relation promotion
- top-navigation inclusion
- whether a visualization becomes public

### Codex
Reserve Codex for boundary-sensitive engineering:
- public-surface consistency audits
- website / GitHub / OSF alignment checks
- review of Claude Code output
- high-risk batch edits
- data architecture affecting MWE relation status
- repository changes that may affect conceptual boundaries

## Allowed Work

Agents may:
- implement explicitly requested website changes
- add approved pages or components
- fix broken imports, routes, or build errors
- add or update technical support files
- implement prepared graph or constellation prototypes
- update JSON / CSV data supplied by the user

## Not Allowed

Agents must not:
- rewrite MWE conceptual framing
- rename pages, models, protocols, notes, or concepts unless explicitly instructed
- invent new relations between MWE concepts
- promote candidate relations into confirmed relations
- remove boundary statements
- imply the website represents the full MWE archive or methodology
- reorganize navigation unless explicitly instructed
- alter OSF, Publications, AI Architecture, Fiction, Artistic Research, or About content without explicit approval
- treat public graph data as full ontology

## Graph and Visualization Rules

For constellation maps, relation graphs, D3 maps, or Three.js maps:
- use only public or explicitly approved data
- preserve candidate / navigation / confirmed / formal dependency / ontology distinctions
- do not make visual centrality imply authority
- keep boundary statements visible
- do not present any visualization as the full MWE system

## Symbol hygiene

When editing human-facing prose, use the proper not-equal symbol `≠` instead of the ASCII marker `!=`.

Apply this only to prose-level content, including:

- Markdown content
- public documentation text
- visible page text
- boundary statements
- human-facing explanatory text

Do not replace `!=` or `!==` in:

- executable code
- JavaScript or TypeScript logic
- config files
- JSON
- scripts
- comparison expressions
- package files
- lockfiles
- generated files
- dependencies

Before committing prose/content edits, scan touched human-facing files for literal `!=`.

Replace `!=` with `≠` only when it appears as prose.

If `!=` appears outside the edited files, report it but do not expand scope unless explicitly approved.

## Required Worklog

After any change, update AGENT_WORKLOG.md with:
- agent used
- task performed
- files changed
- tests or build checks run
- unresolved questions
- risks or assumptions

The user remains final authority for public release, naming, classification, relation confirmation, top navigation, and merge / publication decisions.
