/**
 * React hook for PDF signing workflow.
 */

import { useCallback, useState } from "react";
import type {
  SignPdfParams,
  SigningStatus,
} from "@/types/signature";
import { signPdf as signPdfLib } from "@/lib/pdf-signing";

export interface UsePdfSigningResult {
  /** Current signing status */
  status: SigningStatus;
  /** Progress percentage (0-100) */
  progress: number;
  /** Error message if any */
  error: string | null;
  /** Signed PDF blob */
  signedBlob: Blob | null;
  /** Sign the PDF */
  sign: (params: SignPdfParams) => Promise<Blob | null>;
  /** Download the signed PDF */
  download: () => void;
  /** Reset the hook state */
  reset: () => void;
}

export function usePdfSigning(): UsePdfSigningResult {
  const [status, setStatus] = useState<SigningStatus>("idle");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [signedBlob, setSignedBlob] = useState<Blob | null>(null);

  const sign = useCallback(async (params: SignPdfParams): Promise<Blob | null> => {
    setStatus("loading");
    setProgress(10);
    setError(null);

    try {
      setStatus("signing");
      setProgress(30);

      const result = await signPdfLib(params);

      setProgress(90);
      setSignedBlob(result.blob);
      setStatus("done");
      setProgress(100);

      return result.blob;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to sign PDF";
      setError(errorMessage);
      setStatus("error");
      setProgress(0);
      return null;
    }
  }, []);

  const download = useCallback(() => {
    if (!signedBlob) return;

    const timestamp = new Date().toISOString().slice(0, 10);
    const filename = `signed-${timestamp}.pdf`;

    const url = URL.createObjectURL(signedBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [signedBlob]);

  const reset = useCallback(() => {
    setStatus("idle");
    setProgress(0);
    setError(null);
    setSignedBlob(null);
  }, []);

  return {
    status,
    progress,
    error,
    signedBlob,
    sign,
    download,
    reset,
  };
}
