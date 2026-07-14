// Public Surface and Authority-Ceiling Map — shared byte-identity utilities.
//
// Reusable, browser-safe AND build-safe integrity primitives for the data
// surface. Only Web Crypto (`crypto.subtle`) and the WHATWG TextEncoder /
// TextDecoder are used, so this module runs unchanged in the Astro build
// (Node 22), in a Cloudflare Worker, and in a future Phase 2B browser client.
//
// Integrity boundary:
//   - The PRIMARY integrity digest is SHA-256, computed over the exact byte
//     sequence.
//   - SHA-1 is used ONLY to reproduce the Git blob object id; it is never used
//     as an integrity digest.
//   - For build/server input the byte sequence is the exact UTF-8 source bytes.
//   - For a future browser client the byte sequence is the decoded Fetch
//     response-body bytes BEFORE any text decoding. Phase 2A performs no browser
//     fetch; that boundary is documented here for Phase 2B, not exercised.
//
// This module never uses Node-only crypto, subprocesses, git, the filesystem,
// `response.text()` as a hashing boundary, or JSON reserialization as a hashing
// boundary.

// Size ceilings (raw byte lengths).
export const MAX_MANIFEST_BYTES = 16384;
export const MAX_RUNTIME_SNAPSHOT_BYTES = 262144;

export class ByteIdentityError extends Error {
  readonly code: string;
  constructor(code: string, detail: string) {
    super(`Byte identity violation [${code}]: ${detail}`);
    this.name = "ByteIdentityError";
    this.code = code;
  }
}

function fail(code: string, detail: string): never {
  throw new ByteIdentityError(code, detail);
}

const utf8Encoder = new TextEncoder();
// `fatal: true` makes any malformed UTF-8 sequence throw rather than emit U+FFFD.
const utf8DecoderFatal = new TextDecoder("utf-8", { fatal: true });

/** Encode a string as its exact UTF-8 byte sequence. */
export function toUtf8Bytes(text: string): Uint8Array {
  return utf8Encoder.encode(text);
}

/**
 * Strictly decode a UTF-8 byte sequence to a string. Any invalid byte sequence
 * throws (no U+FFFD replacement, no silent repair).
 */
export function decodeUtf8Fatal(bytes: Uint8Array): string {
  try {
    return utf8DecoderFatal.decode(bytes as BufferSource);
  } catch (error) {
    fail("utf8_decode", `bytes are not valid UTF-8: ${(error as Error).message}`);
  }
}

function toHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

// crypto.subtle.digest wants a contiguous ArrayBuffer view. Copy into a fresh
// buffer so callers may pass views over larger backing buffers safely.
function exactBuffer(bytes: Uint8Array): ArrayBuffer {
  const copy = new Uint8Array(bytes.length);
  copy.set(bytes);
  return copy.buffer;
}

/** SHA-256 hex digest of the exact byte sequence (primary integrity digest). */
export async function sha256Hex(bytes: Uint8Array): Promise<string> {
  return toHex(await crypto.subtle.digest("SHA-256", exactBuffer(bytes)));
}

/**
 * Reproduce the Git blob object id for the exact byte sequence:
 *   SHA-1 of  `blob <decimal-byte-length>\0<raw-bytes>`
 * The NUL separator is assembled as a byte (never embedded literally in source)
 * so this file stays plain text. SHA-1 is used only to reproduce the Git id.
 */
export async function gitBlobSha1Hex(bytes: Uint8Array): Promise<string> {
  const header = utf8Encoder.encode(`blob ${bytes.length}`);
  const combined = new Uint8Array(header.length + 1 + bytes.length);
  combined.set(header, 0);
  combined[header.length] = 0; // NUL separator
  combined.set(bytes, header.length + 1);
  return toHex(await crypto.subtle.digest("SHA-1", combined.buffer));
}

/** Assert an exact byte length. */
export function assertByteLength(
  bytes: Uint8Array,
  expected: number,
  where: string,
): void {
  if (bytes.length !== expected) {
    fail(
      "byte_length",
      `${where}: expected ${expected} bytes, received ${bytes.length}`,
    );
  }
}

/** Assert the byte length does not exceed a ceiling. */
export function assertMaxByteLength(
  bytes: Uint8Array,
  max: number,
  where: string,
): void {
  if (bytes.length > max) {
    fail(
      "byte_length_max",
      `${where}: ${bytes.length} bytes exceeds maximum ${max}`,
    );
  }
}

export interface ExpectedIdentity {
  readonly byteLength: number;
  readonly sha256: string;
  readonly gitBlob: string;
}

/**
 * Validate a byte sequence against a fixed identity: byte length, then SHA-256,
 * then Git blob id — in that order. Any single-byte difference fails.
 */
export async function assertByteIdentity(
  bytes: Uint8Array,
  expected: ExpectedIdentity,
  where: string,
): Promise<void> {
  assertByteLength(bytes, expected.byteLength, where);

  const sha256 = await sha256Hex(bytes);
  if (sha256 !== expected.sha256) {
    fail("sha256", `${where}: expected SHA-256 ${expected.sha256}, computed ${sha256}`);
  }

  const gitBlob = await gitBlobSha1Hex(bytes);
  if (gitBlob !== expected.gitBlob) {
    fail(
      "git_blob",
      `${where}: expected Git blob ${expected.gitBlob}, computed ${gitBlob}`,
    );
  }
}

/**
 * Parse JSON only AFTER byte identity has been validated. The hashing boundary
 * is the raw bytes; JSON is parsed from the fatally-decoded UTF-8 text, never
 * reserialized for hashing.
 */
export async function parseJsonAfterIdentity(
  bytes: Uint8Array,
  expected: ExpectedIdentity,
  where: string,
): Promise<unknown> {
  await assertByteIdentity(bytes, expected, where);
  const text = decodeUtf8Fatal(bytes);
  try {
    return JSON.parse(text);
  } catch (error) {
    fail("json_parse", `${where}: not valid JSON: ${(error as Error).message}`);
  }
}

/**
 * Bounded byte accumulation for a future Phase 2B streaming reader. Concatenates
 * chunks while enforcing a hard ceiling, so an oversize body is rejected without
 * unbounded buffering. Not exercised in Phase 2A (no browser fetch occurs).
 */
export function accumulateBoundedBytes(
  chunks: Iterable<Uint8Array>,
  max: number,
  where: string,
): Uint8Array {
  const collected: Uint8Array[] = [];
  let total = 0;
  for (const chunk of chunks) {
    total += chunk.length;
    if (total > max) {
      fail(
        "byte_length_max",
        `${where}: accumulated ${total} bytes exceeds maximum ${max}`,
      );
    }
    collected.push(chunk);
  }
  const out = new Uint8Array(total);
  let offset = 0;
  for (const chunk of collected) {
    out.set(chunk, offset);
    offset += chunk.length;
  }
  return out;
}
