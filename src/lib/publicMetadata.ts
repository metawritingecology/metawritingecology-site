// Package D — Public Metadata and Structured Representation Contracts.
//
// A bounded, typed representation layer for the public website's HTML `<head>`
// metadata and WebSite/WebPage JSON-LD. It is an ENGINEERING layer only. It is
// not an MWE authority: nothing here asserts Registry status, classification,
// public/private judgment, relation validity, OSF status, publication status,
// naming authority, or ontology. Sitemap or canonical presence never implies
// Registry status; a JSON-LD `isPartOf` relationship is not an ontology
// relation; a structured `genre` string is not MWE classification.
//
// Hybrid design (per approved Package D decisions):
// - page-local title and description remain in Astro props / Markdown
//   frontmatter and are NOT duplicated into a central registry;
// - route POLICY (language, canonical, indexing, structured-data enablement,
//   and existing structured genre only where already emitted) is centralized in
//   an explicit typed registry covering every BaseLayout route;
// - structured data is RESOLVED from the page title, page description,
//   route-policy language, canonical URL, and approved route policy through one
//   resolver, so the HTML meta description and the WebPage JSON-LD description
//   always share a single value.
//
// Supported page languages are exactly `en` and `zh`. JSON-LD types are exactly
// WebSite and WebPage. No Open Graph, Twitter, hreflang, alternate-language, or
// og:locale contract is introduced. This module has NO Node/runtime
// dependencies so it can be bundled into the SSR worker safely.

// ---------------------------------------------------------------------------
// Types (behavioral contract; erasable TypeScript only)
// ---------------------------------------------------------------------------

export type PageLanguage = "en" | "zh";

export type CanonicalPolicy = { kind: "self" } | { kind: "none" };

export type IndexingPolicy =
  | { kind: "indexable" }
  | { kind: "noindex"; follow: boolean };

export type StructuredDataPolicy =
  | { enabled: false }
  | {
      enabled: true;
      type: "WebPage";
      genre?: string;
    };

export type RouteMetadataPolicy = {
  language: PageLanguage;
  canonical: CanonicalPolicy;
  indexing: IndexingPolicy;
  structuredData: StructuredDataPolicy;
};

export type ResolvedStructuredData =
  | { enabled: false }
  | {
      enabled: true;
      type: "WebPage";
      name: string;
      description: string;
      url: string;
      inLanguage: PageLanguage;
      genre?: string;
    };

export type ResolvedPublicMetadata = {
  route: string;
  title: string;
  description?: string;
  language: PageLanguage;
  canonicalUrl?: string;
  robots?: string;
  structuredData: ResolvedStructuredData;
};

export type ResolveInput = {
  route: string;
  title: string;
  description?: string;
  siteOrigin: string;
};

// ---------------------------------------------------------------------------
// Bounded constants
// ---------------------------------------------------------------------------

// The single approved production origin. This mirrors Package C's
// PRODUCTION_ORIGIN; a source-level test asserts the two remain identical so
// there is one canonical-origin authority. Arbitrary, preview, or workers.dev
// origins can never enter canonical output.
export const APPROVED_PRODUCTION_ORIGIN = "https://metawritingecology.org";

export const SUPPORTED_LANGUAGES: readonly PageLanguage[] = ["en", "zh"];

// The only permitted page-level structured-data type.
export const SUPPORTED_STRUCTURED_TYPE = "WebPage" as const;

// The only permitted JSON-LD node types in the emitted graph.
export const SUPPORTED_JSONLD_TYPES: readonly string[] = ["WebSite", "WebPage"];

// Frontmatter / metadata keys that are inert authority fields and must NEVER be
// serialized into public metadata or JSON-LD. Enforced by tests and the build
// verifier — the ceiling is held by types and tests, not new page prose.
export const FORBIDDEN_METADATA_KEYS: readonly string[] = [
  "status",
  "classification",
  "visibility",
  "archive",
  "registry",
  "authority",
  "relation",
  "publication",
  "ontology"
];

// The WebSite node's stable public semantics. Preserved exactly from the prior
// implementation; only its type-level composition is centralized here.
export const WEBSITE_NODE = {
  name: "Meta-Writing Ecology",
  description:
    "Public orientation surfaces for Meta-Writing Ecology, a recursive linguistic and structural analysis system."
} as const;

// ---------------------------------------------------------------------------
// Fail-closed error
// ---------------------------------------------------------------------------

export class PublicMetadataError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.name = "PublicMetadataError";
    this.code = code;
  }
}

// ---------------------------------------------------------------------------
// Route normalization (dependency-free; equivalent trailing-slash contract)
// ---------------------------------------------------------------------------

export function normalizeRoute(input: string): string {
  if (typeof input !== "string" || input.length === 0) {
    throw new PublicMetadataError(
      "ROUTE_INPUT_INVALID",
      "route must be a non-empty string"
    );
  }
  let path = input.split("#")[0].split("?")[0];
  if (!path.startsWith("/")) path = `/${path}`;
  path = path.replace(/\/{2,}/g, "/");
  if (path === "/") return "/";
  const last = path.replace(/\/+$/, "").split("/").pop() ?? "";
  const hasExtension = last.includes(".");
  path = path.replace(/\/+$/, "");
  if (path === "") return "/";
  return hasExtension ? path : `${path}/`;
}

// ---------------------------------------------------------------------------
// The typed shared-layout route registry
// ---------------------------------------------------------------------------
//
// Every route rendered through BaseLayout MUST appear here exactly once. There
// is NO generic fallback: an unregistered BaseLayout route fails closed in the
// resolver rather than silently receiving generic metadata. The registry holds
// only mechanical route policy — language, canonical policy, indexing policy,
// structured-data enablement, and the existing structured genre already emitted
// for the route. It holds no page title, body description, Registry state,
// classification, visibility, publication status, relation status, archive
// state, or authority claim.

const DEFAULT_GENRE = "Public orientation surface";

// English, indexable, self-canonical, WebPage JSON-LD enabled with the route's
// existing emitted genre.
function en(genre: string = DEFAULT_GENRE): RouteMetadataPolicy {
  return {
    language: "en",
    canonical: { kind: "self" },
    indexing: { kind: "indexable" },
    structuredData: { enabled: true, type: "WebPage", genre }
  };
}

// Chinese (zh), indexable, self-canonical, WebPage JSON-LD enabled. Genre is the
// route's existing emitted genre (the default orientation genre).
function zh(genre: string = DEFAULT_GENRE): RouteMetadataPolicy {
  return {
    language: "zh",
    canonical: { kind: "self" },
    indexing: { kind: "indexable" },
    structuredData: { enabled: true, type: "WebPage", genre }
  };
}

export const ROUTE_METADATA_REGISTRY: Readonly<Record<string, RouteMetadataPolicy>> = {
  // --- 40 indexable routes -------------------------------------------------
  "/": en(),
  "/about/": en(),
  "/ai-readable-knowledge-architecture/": en("AI-readable boundary page"),
  "/ai-reading-guide/": en(),
  "/ai-training-boundary/": en(),
  "/application-boundary/": en("Public boundary page"),
  "/artistic-research/": en(),
  "/atlas/": en(),
  "/boundary-preserving-use-conditions/": en(),
  "/boundary/": en(),
  "/citation-guide/": en(),
  "/diagnostic-entry-layer/": en(),
  "/document-types/": en(),
  "/dramatic-surfaces/": en(),
  "/entry-points/": en("Thematic reading orientation"),
  "/fiction/": en(),
  "/fiction/delivery-not-established/": en(),
  "/fiction/reading-paths/": en(),
  "/fiction/the-available-edition/": en(),
  "/fiction/the-central-naming-tower/": en(),
  "/fiction/the-city-of-the-residual-miracle/": en(),
  "/fiction/the-field-below-the-index/": en(),
  "/fiction/the-house-without-evidence/": en(),
  "/fiction/the-office-of-allocated-meaning/": en(),
  "/fiction/the-repair-of-neglected-wings/": en(),
  "/interpretation-boundaries/": en("Public boundary page"),
  "/llms-boundary/": en("AI-readable boundary page"),
  "/models/": en("Classification-aware conceptual navigation"),
  "/platforms/": en(),
  "/pre-model-writing/": en(),
  "/public-anchors/": en(),
  "/public-records/": en("Public-record summary"),
  "/public-surface-map/": en(),
  "/public-version-notes/": en(),
  "/publications/": en("Publication and citation record"),
  "/site-notes/": en(),
  "/surfaces/": en(),
  "/three-questions/": en(),
  "/zh/": zh(),
  "/zh/boundary/": zh(),

  // --- 1 interactive noindex preview (self-canonical, JSON-LD enabled) ------
  "/public-surface-map/interactive/": {
    language: "en",
    canonical: { kind: "self" },
    indexing: { kind: "noindex", follow: false },
    structuredData: { enabled: true, type: "WebPage", genre: DEFAULT_GENRE }
  }
};

export function getRegisteredRoutes(): string[] {
  return Object.keys(ROUTE_METADATA_REGISTRY);
}

export function getRoutePolicy(route: string): RouteMetadataPolicy | undefined {
  return ROUTE_METADATA_REGISTRY[normalizeRoute(route)];
}

// ---------------------------------------------------------------------------
// Origin validation
// ---------------------------------------------------------------------------

// Return the approved origin string, or fail closed. Only the exact approved
// production origin is accepted; any preview, workers.dev, localhost, or
// arbitrary origin is rejected before it can enter a canonical URL.
export function assertApprovedOrigin(siteOrigin: string): string {
  let origin: string;
  try {
    origin = new URL(siteOrigin).origin;
  } catch {
    throw new PublicMetadataError(
      "ORIGIN_INVALID",
      `site origin is not a valid absolute URL: ${String(siteOrigin)}`
    );
  }
  if (origin !== APPROVED_PRODUCTION_ORIGIN) {
    throw new PublicMetadataError(
      "ORIGIN_FORBIDDEN",
      `canonical origin must be exactly ${APPROVED_PRODUCTION_ORIGIN}, got ${origin}`
    );
  }
  return origin;
}

// ---------------------------------------------------------------------------
// Robots derivation (from the typed indexing policy only)
// ---------------------------------------------------------------------------

export function robotsFromIndexing(indexing: IndexingPolicy): string | undefined {
  if (indexing.kind === "indexable") return undefined; // no robots meta emitted
  return indexing.follow ? "noindex, follow" : "noindex, nofollow";
}

// ---------------------------------------------------------------------------
// Core resolver
// ---------------------------------------------------------------------------

function requireNonEmpty(value: unknown, code: string, label: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new PublicMetadataError(code, `${label} must be a non-empty string`);
  }
  return value;
}

// Resolve metadata for an EXPLICIT policy. Exposed so tests can inject an
// out-of-contract policy (unsupported language, unsupported JSON-LD type,
// structured-without-canonical) and confirm each fails closed. The registry
// resolver below delegates here.
export function resolveMetadataForPolicy(
  policy: RouteMetadataPolicy,
  input: ResolveInput
): ResolvedPublicMetadata {
  const route = normalizeRoute(input.route);
  const title = requireNonEmpty(input.title, "TITLE_EMPTY", "title");
  const description = requireNonEmpty(
    input.description,
    "DESCRIPTION_REQUIRED",
    "description"
  );

  if (!SUPPORTED_LANGUAGES.includes(policy.language)) {
    throw new PublicMetadataError(
      "UNSUPPORTED_LANGUAGE",
      `unsupported page language: ${String(policy.language)}`
    );
  }

  const origin = assertApprovedOrigin(input.siteOrigin);

  const canonicalUrl =
    policy.canonical.kind === "self" ? `${origin}${route}` : undefined;

  const robots = robotsFromIndexing(policy.indexing);

  let structuredData: ResolvedStructuredData;
  if (!policy.structuredData.enabled) {
    structuredData = { enabled: false };
  } else {
    if (policy.structuredData.type !== SUPPORTED_STRUCTURED_TYPE) {
      throw new PublicMetadataError(
        "UNSUPPORTED_JSONLD_TYPE",
        `unsupported structured-data type: ${String(policy.structuredData.type)}`
      );
    }
    if (!canonicalUrl) {
      throw new PublicMetadataError(
        "STRUCTURED_WITHOUT_CANONICAL",
        "structured data enabled without a canonical URL"
      );
    }
    structuredData = {
      enabled: true,
      type: "WebPage",
      name: title,
      description,
      url: canonicalUrl,
      inLanguage: policy.language
    };
    if (policy.structuredData.genre !== undefined) {
      structuredData.genre = policy.structuredData.genre;
    }
  }

  const resolved: ResolvedPublicMetadata = {
    route,
    title,
    description,
    language: policy.language,
    structuredData
  };
  if (canonicalUrl) resolved.canonicalUrl = canonicalUrl;
  if (robots !== undefined) resolved.robots = robots;
  return resolved;
}

// Resolve metadata for a REGISTERED BaseLayout route. Fails closed on an
// unknown route rather than emitting generic metadata.
export function resolvePublicMetadata(input: ResolveInput): ResolvedPublicMetadata {
  const route = normalizeRoute(input.route);
  const policy = ROUTE_METADATA_REGISTRY[route];
  if (!policy) {
    throw new PublicMetadataError(
      "UNKNOWN_ROUTE",
      `route is not registered in the BaseLayout metadata registry: ${route}`
    );
  }
  return resolveMetadataForPolicy(policy, { ...input, route });
}

// ---------------------------------------------------------------------------
// JSON-LD graph construction (WebSite + WebPage only)
// ---------------------------------------------------------------------------

export type JsonLdWebSite = {
  "@type": "WebSite";
  "@id": string;
  name: string;
  url: string;
  description: string;
};

export type JsonLdWebPage = {
  "@type": "WebPage";
  "@id": string;
  name: string;
  url: string;
  description: string;
  inLanguage: PageLanguage;
  genre?: string;
  isPartOf: { "@id": string };
};

export type JsonLdGraph = {
  "@context": "https://schema.org";
  "@graph": (JsonLdWebSite | JsonLdWebPage)[];
};

// Build the WebSite/WebPage JSON-LD graph for a resolved page, or return null
// when structured data is disabled. The WebPage description equals the resolved
// HTML meta description, the WebPage inLanguage equals the resolved HTML
// language, and the WebPage URL equals the resolved canonical URL. Fails closed
// if any node type would fall outside the WebSite/WebPage ceiling.
export function buildJsonLd(
  resolved: ResolvedPublicMetadata,
  siteOrigin: string
): JsonLdGraph | null {
  if (!resolved.structuredData.enabled) return null;
  const origin = assertApprovedOrigin(siteOrigin);
  const siteUrl = `${origin}/`;
  const websiteId = `${siteUrl}#website`;

  const sd = resolved.structuredData;

  const website: JsonLdWebSite = {
    "@type": "WebSite",
    "@id": websiteId,
    name: WEBSITE_NODE.name,
    url: siteUrl,
    description: WEBSITE_NODE.description
  };

  const webpage: JsonLdWebPage = {
    "@type": "WebPage",
    "@id": `${sd.url}#webpage`,
    name: sd.name,
    url: sd.url,
    description: sd.description,
    inLanguage: sd.inLanguage,
    isPartOf: { "@id": websiteId }
  };
  if (sd.genre !== undefined) {
    // Insert genre between inLanguage and isPartOf for a deterministic shape.
    const withGenre: JsonLdWebPage = {
      "@type": "WebPage",
      "@id": webpage["@id"],
      name: webpage.name,
      url: webpage.url,
      description: webpage.description,
      inLanguage: webpage.inLanguage,
      genre: sd.genre,
      isPartOf: webpage.isPartOf
    };
    return finalizeGraph([website, withGenre]);
  }
  return finalizeGraph([website, webpage]);
}

function finalizeGraph(nodes: (JsonLdWebSite | JsonLdWebPage)[]): JsonLdGraph {
  for (const node of nodes) {
    if (!SUPPORTED_JSONLD_TYPES.includes(node["@type"])) {
      throw new PublicMetadataError(
        "UNSUPPORTED_JSONLD_TYPE",
        `JSON-LD node type outside the WebSite/WebPage ceiling: ${String(node["@type"])}`
      );
    }
  }
  return { "@context": "https://schema.org", "@graph": nodes };
}
