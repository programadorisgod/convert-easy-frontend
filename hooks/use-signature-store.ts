/**
 * React hook for managing signature storage.
 */

import { useCallback, useEffect, useState } from "react";
import type { StoredSignature } from "@/types/signature";
import {
  saveSignature as storeSave,
  loadSignatures as storeLoad,
  deleteSignature as storeDelete,
  clearSignatures as storeClear,
} from "@/lib/signature-store";

export interface UseSignatureStoreResult {
  /** All saved signatures */
  signatures: StoredSignature[];
  /** Currently loading */
  isLoading: boolean;
  /** Error message if any */
  error: string | null;
  /** Save a new signature */
  save: (
    dataUrl: string,
    name: string,
    width: number,
    height: number,
  ) => Promise<StoredSignature | null>;
  /** Delete a signature by ID */
  delete: (id: string) => Promise<boolean>;
  /** Refresh signatures from storage */
  refresh: () => Promise<void>;
  /** Clear all signatures */
  clear: () => Promise<void>;
}

export function useSignatureStore(): UseSignatureStoreResult {
  const [signatures, setSignatures] = useState<StoredSignature[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load signatures on mount
  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const loaded = await storeLoad();
        setSignatures(loaded);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load signatures");
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  const save = useCallback(
    async (
      dataUrl: string,
      name: string,
      width: number,
      height: number,
    ) => {
      setError(null);
      try {
        const saved = await storeSave(dataUrl, name, width, height);
        if (saved) {
          setSignatures((prev) => [...prev, saved]);
        }
        return saved;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to save signature");
        return null;
      }
    },
    [],
  );

  const deleteFn = useCallback(async (id: string) => {
    setError(null);
    try {
      const deleted = await storeDelete(id);
      if (deleted) {
        setSignatures((prev) => prev.filter((s) => s.id !== id));
      }
      return deleted;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete signature");
      return false;
    }
  }, []);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const loaded = await storeLoad();
      setSignatures(loaded);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to refresh signatures");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clear = useCallback(async () => {
    setError(null);
    try {
      await storeClear();
      setSignatures([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to clear signatures");
    }
  }, []);

  return {
    signatures,
    isLoading,
    error,
    save,
    delete: deleteFn,
    refresh,
    clear,
  };
}
