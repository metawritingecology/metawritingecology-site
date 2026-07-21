# Security and Observability Boundaries

This document separates what this repository enforces from what is externally
observed and from what this repository does not, by itself, establish. It is a
boundary description, not a monitoring guarantee.

## A. Repository-enforced controls

The following controls are demonstrable from repository code and tests in this
repository:

- deterministic site CI;
- build, Astro, TypeScript, and repository contract checks;
- Wrangler dry-run validation;
- the custom HTTP 404 contract;
- the SSR and static response-header architecture;
- enforced same-origin framing (`frame-ancestors 'self'`);
- a broader Content-Security-Policy operating in Report-Only mode;
- security-resilience tests;
- public-surface-map response verification;
- the `security.txt` source and response contract.

These scripts, tests, and documents are engineering checks. They are not
semantic authorities. They verify repository contracts, but they do not prove
every external platform setting or every future runtime condition.

## B. Externally observed platform signals

The following are observed as external signals rather than as guarantees made
by this repository. They originate from GitHub, Cloudflare, browsers, or
third-party services, and they must be reverified when those platforms or
services change:

- GitHub check results;
- Cloudflare Workers build and deployment records;
- production and preview HTTP response inspection;
- browser console and network inspection;
- Cloudflare-generated NEL (Network Error Logging) `Report-To` headers;
- preview-origin indexing overlays;
- third-party search-service CORS behavior.

The following Package 2A interpretation boundaries apply to these observed
signals:

1. Cloudflare may emit a Network Error Logging `Report-To` header independently
   of this repository's CSP reporting policy. Its presence is a
   platform-generated signal, not a repository CSP reporting configuration.

2. Workers preview responses may apply a general `X-Robots-Tag: noindex`
   overlay even when the repository source contains a more specific path rule.
   This is a preview-origin overlay behavior, not the repository path rule.

3. The production search origin may be accepted by an external search service
   while `workers.dev` preview origins are not present in that service's CORS
   allowlist. This is an external-service and origin limitation, not a
   repository defect.

These observations describe behavior seen at a point in time. They are not
claimed to be permanently configured, and they must be reverified when external
platform settings or services change.

## C. Controls not asserted

This repository does not, by itself, establish or prove any of the following:

- continuous uptime monitoring;
- incident paging;
- a security operations center;
- SIEM or centralized log ingestion;
- log-retention duration;
- complete request-log access;
- automatic incident response;
- vulnerability-response SLAs;
- guaranteed report confidentiality;
- a bug bounty;
- Cloudflare-account configuration;
- GitHub-organization configuration;
- Email Routing internals;
- private mailbox identity;
- a complete MWE archive, Registry, or authority map.

## Review boundary

- Repository scripts produce tests, inventories, and review evidence.
- GitHub and Cloudflare records provide external operational evidence.
- Neither layer replaces user authority over publication, classification,
  Registry status, public/private boundaries, or final release decisions.

This document contains no private operational credentials, mailbox details,
account identifiers, tokens, or dashboard exports.
