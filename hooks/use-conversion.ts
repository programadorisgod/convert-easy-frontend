"use client";

import { useState, useCallback, useRef } from "react";
import { convertFile, downloadResult, getJobStatus, pollJobStatus } from "@/lib/api-service";
import type { ConversionConfig } from "@/lib/conversion-config";

export type ConversionStatus =
  | "idle"
  | "uploading"
  | "converting"
  | "completed"
  | "error";

export interface ConversionResult {
  jobId: string;
  downloadUrl?: string;
  outputFormat: string;
}

export interface UseConversionReturn {
  status: ConversionStatus;
  progress: number;
  error: string | null;
  result: ConversionResult | null;
  isConverting: boolean;
  startConversion: (file: File) => Promise<void>;
  reset: () => void;
  downloadFile: () => Promise<void>;
  cancel: () => void;
}

export function useConversion(config: ConversionConfig): UseConversionReturn {
  const [status, setStatus] = useState<ConversionStatus>("idle");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ConversionResult | null>(null);
  
  const jobIdRef = useRef<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const reset = useCallback(() => {
    setStatus("idle");
    setProgress(0);
    setError(null);
    setResult(null);
    jobIdRef.current = null;
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
  }, []);

  const cancel = useCallback(() => {
    if (jobIdRef.current) {
      abortControllerRef.current?.abort();
      reset();
    }
  }, [reset]);

  const downloadFile = useCallback(async () => {
    if (!result?.jobId) return;

    try {
      const blob = await downloadResult(result.jobId, result.outputFormat);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `converted.${result.outputFormat}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error downloading file");
    }
  }, [result]);

  const startConversion = useCallback(
    async (file: File) => {
      reset();
      setStatus("uploading");
      setProgress(0);
      setError(null);

      try {
        abortControllerRef.current = new AbortController();

        const inputFormat = config.targetFormat === "multiple" 
          ? file.type.split("/")[1] || "pdf"
          : file.type.split("/")[1] || "pdf";

        const outputFormats = config.targetFormat === "multiple"
          ? ["pdf"]
          : [config.targetFormat];

        const useDocumentEndpoint = config.category === "document";
        
        const jobId = await convertFile(
          file,
          inputFormat,
          outputFormats,
          (stage, prog) => {
            if (stage === "uploading") {
              setStatus("uploading");
              setProgress(prog);
            } else if (stage === "converting") {
              setStatus("converting");
              setProgress(prog);
            }
          },
          useDocumentEndpoint ? { useDocumentEndpoint: true } : undefined
        );

        jobIdRef.current = jobId;
        setStatus("converting");

        const finalStatus = await pollJobStatus(
          jobId,
          (statusResponse) => {
            if (statusResponse.status === "processing" || statusResponse.status === "queued") {
              setStatus("converting");
              setProgress(50);
            }
          },
          1000,
          300
        );

        if (finalStatus.status === "completed") {
          setStatus("completed");
          setProgress(100);
          setResult({
            jobId: jobId,
            outputFormat: outputFormats[0],
          });
        } else if (finalStatus.status === "failed") {
          throw new Error(finalStatus.error_message || "Conversion failed");
        } else if (finalStatus.status === "cancelled") {
          throw new Error("Conversion was cancelled");
        }
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") {
          reset();
          return;
        }
        setStatus("error");
        setError(err instanceof Error ? err.message : "An error occurred during conversion");
      }
    },
    [config, reset]
  );

  return {
    status,
    progress,
    error,
    result,
    isConverting: status === "uploading" || status === "converting",
    startConversion,
    reset,
    downloadFile,
    cancel,
  };
}
