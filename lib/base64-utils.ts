/**
 * Shared Base64 <-> image helpers used by the editor and the standalone tools.
 *
 * Both directions run entirely client-side (no round-trip to the backend).
 * Backend sync endpoints exist as a fallback / public API surface.
 */

export interface ParsedBase64 {
  /** Raw base64 payload with no Data URI header. */
  payload: string;
  /** MIME type inferred from a Data URI header, if present. */
  mime: string | null;
}

/**
 * Split a Data URI like ``data:image/png;base64,<payload>`` from a raw
 * base64 string. Returns the payload plus the MIME (when present).
 */
export function parseBase64Input(input: string): ParsedBase64 {
  const value = (input ?? "").trim();
  if (value.startsWith("data:") && value.includes(",")) {
    const comma = value.indexOf(",");
    const header = value.slice(0, comma);
    const payload = value.slice(comma + 1).trim();
    const mime = header.startsWith("data:")
      ? header.slice("data:".length).split(";")[0] || null
      : null;
    return { payload, mime };
  }
  return { payload: value, mime: null };
}

/** Strict-ish validation that a string is decodable base64. */
export function isValidBase64(payload: string): boolean {
  const value = (payload ?? "").replace(/\s+/g, "");
  if (!value) return false;
  if (value.length % 4 !== 0) return false;
  // Strip optional padding before testing the charset.
  const unpadded = value.replace(/=+$/, "");
  if (!/^[A-Za-z0-9+/]+$/.test(unpadded)) return false;
  try {
    const bytes = atob(value);
    return bytes.length > 0;
  } catch {
    return false;
  }
}

export const MIME_TO_EXT: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/gif": "gif",
  "image/webp": "webp",
  "image/avif": "avif",
  "image/bmp": "bmp",
  "image/tiff": "tiff",
  "image/svg+xml": "svg",
};

/** Pick a filename extension for a decoded image, defaulting to png. */
export function extFromMime(mime: string | null | undefined): string {
  if (!mime) return "png";
  return MIME_TO_EXT[mime] || "png";
}

/**
 * Decode a base64 string (payload or full Data URI) into bytes + MIME.
 * Throws if the input isn't valid base64.
 */
export function decodeBase64Image(
  input: string,
): { bytes: Uint8Array; mime: string } {
  const { payload, mime } = parseBase64Input(input);
  // atob handles unpadded gracefully in modern browsers, but be explicit.
  const value = (payload || "").replace(/\s+/g, "");
  if (!value || !isValidBase64(value)) {
    throw new Error("Input no es Base64 válido");
  }
  // Repad if needed (some sources strip padding).
  const padded = value + "=".repeat((4 - (value.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return { bytes, mime: mime || "image/png" };
}

/** Read a browser File (image) into a base64 string via FileReader. */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("No se pudo leer el archivo"));
    reader.readAsDataURL(file);
  });
}

/** Build a Data URI string from raw base64 payload + MIME. */
export function toDataUri(payload: string, mime: string): string {
  return `data:${mime};base64,${payload}`;
}

/** Trigger a browser download of the given bytes under a filename. */
export function downloadBytes(
  bytes: Uint8Array,
  filename: string,
  mime: string,
): void {
  const blob = new Blob([bytes as BlobPart], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Trigger a browser download of a text string under a filename. */
export function downloadText(text: string, filename: string): void {
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Copy text to the clipboard, falling back to execCommand. */
export async function copyToClipboard(text: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand("copy");
    document.body.removeChild(textarea);
  }
}
