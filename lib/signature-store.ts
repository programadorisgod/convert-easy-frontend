/**
 * localStorage CRUD operations for signature persistence.
 */

import type { StoredSignature } from "@/types/signature";

const STORAGE_KEY = "convert-easy-signatures";

/**
 * Generate a UUID v4.
 */
function generateId(): string {
  return crypto.randomUUID();
}

/**
 * Save a new signature to localStorage.
 * @param dataUrl - PNG base64 image data
 * @param name - User-defined label
 * @param width - Canvas width
 * @param height - Canvas height
 * @returns The created signature or null on error
 */
export async function saveSignature(
  dataUrl: string,
  name: string,
  width: number,
  height: number,
): Promise<StoredSignature | null> {
  const signature: StoredSignature = {
    id: generateId(),
    name,
    dataUrl,
    createdAt: Date.now(),
    width,
    height,
  };

  try {
    const existing = await loadSignatures();
    const updated = [...existing, signature];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return signature;
  } catch (error) {
    console.error("Failed to save signature:", error);
    return null;
  }
}

/**
 * Load all saved signatures from localStorage.
 * @returns Array of stored signatures
 */
export async function loadSignatures(): Promise<StoredSignature[]> {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (s): s is StoredSignature =>
        s &&
        typeof s.id === "string" &&
        typeof s.name === "string" &&
        typeof s.dataUrl === "string",
    );
  } catch (error) {
    console.error("Failed to load signatures:", error);
    return [];
  }
}

/**
 * Delete a signature by ID.
 * @param id - Signature UUID
 * @returns True if deleted, false if not found or on error
 */
export async function deleteSignature(id: string): Promise<boolean> {
  try {
    const existing = await loadSignatures();
    const filtered = existing.filter((s) => s.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    return true;
  } catch (error) {
    console.error("Failed to delete signature:", error);
    return false;
  }
}

/**
 * Clear all saved signatures.
 */
export async function clearSignatures(): Promise<void> {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error("Failed to clear signatures:", error);
  }
}
