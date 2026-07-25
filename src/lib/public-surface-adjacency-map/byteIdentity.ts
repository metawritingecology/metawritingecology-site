// Expanded Public Surface Adjacency Map — byte-identity utilities.
//
// Independent namespace copy. This module is deliberately NOT shared with
// `src/lib/public-surface-authority-map/` so the expanded product owns its own
// contract surface end to end and the frozen 30-record product keeps its own.
//
// Only Web Crypto (`crypto.subtle`) and the WHATWG TextEncoder / TextDecoder are
// used, so this module runs unchanged in the Astro build (Node 22), in a
// Cloudflare Worker, and in the browser client.
//
// Integrity boundary:
//   - SHA-256 is the PRIMARY integrity digest over the exact byte sequence.
//   - SHA-1 is used ONLY to reproduce the Git blob object id; never as an
//     integrity digest.
//   - For build input the byte sequence is the exact UTF-8 source bytes.
//   - For the browser client the byte sequence is the decoded Fetch
//     response-body bytes BEFORE any text decoding.
//
// No Node-only crypto, no subprocess, no git, no filesystem, and never
// `response.text()` / `response.json()` or JSON reserialization as a hashing
// boundary.

/** Runtime-manifest maximum decoded response size (bytes). */
export const MAX_MANIFEST_BYTES = 16384;
/** Runtime-snapshot maximum decoded response size (bytes). */
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
 * Strictly decode a UTF-8 byte sequence. Any invalid byte sequence throws (no
 * U+FFFD replacement, no silent repair).
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

export interface ExpectedIdentity {
  readonly byteLength: number;
  readonly sha256: string;
  readonly gitBlob: string;
}

/** Assert an exact byte length. */
export function assertByteLength(
  bytes: Uint8Array,
  expected: number,
  where: string,
): void {
  if (bytes.length !== expected) {
    fail("byte_length", `${where}: expected ${expected} bytes, received ${bytes.length}`);
  }
}

/** Assert the byte length does not exceed a ceiling. */
export function assertMaxByteLength(
  bytes: Uint8Array,
  max: number,
  where: string,
): void {
  if (bytes.length > max) {
    fail("byte_length_max", `${where}: ${bytes.length} bytes exceeds maximum ${max}`);
  }
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
    fail("git_blob", `${where}: expected Git blob ${expected.gitBlob}, computed ${gitBlob}`);
  }
}
