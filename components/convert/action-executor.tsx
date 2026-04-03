"use client";

import {
  convertFile,
  processImageFile,
  processPdfFile,
  createUploadedJob,
  queuePdfMergeFromJobs,
  pollJobStatus,
  downloadResult,
  cancelJob,
} from "@/lib/api-service";
import type { JobStatusResponse } from "@/types/api";
import type { ConversionConfig, ToolConfig, ActionType } from "@/lib/conversion-config";
import { sileo } from "sileo";
import { AlertCircle, Sparkles, Loader2, X } from "lucide-react";

export interface ActionResult {
  blob: Blob;
  filename: string;
  jobId: string;
}

export interface ActionExecutorOptions {
  file: File;
  config: ConversionConfig | ToolConfig;
  onProgress?: (stage: string, progress: number) => void;
  onCancel?: () => void;
}

export async function executeAction({
  file,
  config,
  onProgress,
}: ActionExecutorOptions): Promise<ActionResult> {
  const inputFormat = file.name.split(".").pop()?.toLowerCase() || "";
  const fileNameBase = file.name.split(".").slice(0, -1).join(".") || file.name;

  const isConversion = config.type === "convert";
  const isDocument = config.category === "document";

  if (isConversion) {
    return executeConversion({
      file,
      inputFormat,
      fileNameBase,
      config: config as ConversionConfig,
      onProgress,
    });
  }

  return executeTool({
    file,
    inputFormat,
    fileNameBase,
    config: config as ToolConfig,
    onProgress,
  });
}

interface ExecuteConversionOptions {
  file: File;
  inputFormat: string;
  fileNameBase: string;
  config: ConversionConfig;
  onProgress?: (stage: "uploading" | "processing", progress: number) => void;
}

async function executeConversion({
  file,
  inputFormat,
  fileNameBase,
  config,
  onProgress,
}: ExecuteConversionOptions): Promise<ActionResult> {
  const outputFormat = config.targetFormat;
  const useDocumentEndpoint = config.category === "document";

  const jobId = await convertFile(
    file,
    inputFormat,
    [outputFormat],
    (stage, progress) => {
      const mappedStage = stage === "converting" ? "processing" : stage;
      onProgress?.(mappedStage, progress);
    },
    {
      useDocumentEndpoint,
      preferredDocumentEngine: "auto",
    }
  );

  const finalStatus = await pollJobStatus(jobId, (status) => {
    if (status.status === "failed") {
      throw new Error(status.error_message || "La conversión falló");
    }
  });

  if (finalStatus.status !== "completed") {
    throw new Error(finalStatus.error_message || "La conversión no se completó");
  }

  const blob = await downloadResult(jobId, outputFormat);
  const filename = `${fileNameBase}.${outputFormat}`;

  return { blob, filename, jobId };
}

interface ExecuteToolOptions {
  file: File;
  inputFormat: string;
  fileNameBase: string;
  config: ToolConfig;
  onProgress?: (stage: "uploading" | "processing", progress: number) => void;
}

async function executeTool({
  file,
  inputFormat,
  fileNameBase,
  config,
  onProgress,
}: ExecuteToolOptions): Promise<ActionResult> {
  switch (config.type) {
    case "compress":
      return executePdfCompress({
        file,
        inputFormat,
        fileNameBase,
        config,
        onProgress,
      });

    case "organize":
      return executePdfOrganize({
        file,
        inputFormat,
        fileNameBase,
        config,
        onProgress,
      });

    case "protect":
      return executePdfProtect({
        file,
        inputFormat,
        fileNameBase,
        config,
        onProgress,
      });

    case "extract":
      return executeAudioExtract({
        file,
        inputFormat,
        fileNameBase,
        config,
        onProgress,
      });

    case "trim":
      return executeTrim({
        file,
        inputFormat,
        fileNameBase,
        config,
        onProgress,
      });

    case "normalize":
      return executeNormalize({
        file,
        inputFormat,
        fileNameBase,
        config,
        onProgress,
      });

    case "sign":
      sileo.info({
        title: "Próximamente",
        description: "La firma digital estará disponible en una actualización futura.",
        icon: <Sparkles className="size-3.5" />,
        roundness: 16,
        duration: 3500,
      });
      throw new Error("Esta función aún no está disponible");

    default:
      throw new Error(`Tipo de acción no soportado: ${config.type}`);
  }
}

interface ExecutePdfCompressOptions {
  file: File;
  inputFormat: string;
  fileNameBase: string;
  config: ToolConfig;
  onProgress?: (stage: "uploading" | "processing", progress: number) => void;
}

async function executePdfCompress({
  file,
  inputFormat,
  fileNameBase,
  config,
  onProgress,
}: ExecutePdfCompressOptions): Promise<ActionResult> {
  const outputFormat = config.outputFormat || "pdf";

  const jobId = await processPdfFile(
    file,
    inputFormat,
    "compress",
    { level: "balanced" },
    outputFormat,
    (stage, progress) => onProgress?.(stage, progress)
  );

  const finalStatus = await pollJobStatus(jobId, (status) => {
    if (status.status === "failed") {
      throw new Error(status.error_message || "La compresión falló");
    }
  });

  if (finalStatus.status !== "completed") {
    throw new Error(finalStatus.error_message || "La compresión no se completó");
  }

  const blob = await downloadResult(jobId, outputFormat);
  const filename = `${fileNameBase}_compressed.${outputFormat}`;

  return { blob, filename, jobId };
}

interface ExecutePdfOrganizeOptions {
  file: File;
  inputFormat: string;
  fileNameBase: string;
  config: ToolConfig;
  onProgress?: (stage: "uploading" | "processing", progress: number) => void;
}

async function executePdfOrganize({
  file,
  inputFormat,
  fileNameBase,
  config,
  onProgress,
}: ExecutePdfOrganizeOptions): Promise<ActionResult> {
  // For single PDF, show split options
  const jobId = await processPdfFile(
    file,
    inputFormat,
    "split-range",
    { start_page: 1, end_page: 1 },
    "pdf",
    (stage, progress) => onProgress?.(stage, progress)
  );

  const finalStatus = await pollJobStatus(jobId, (status) => {
    if (status.status === "failed") {
      throw new Error(status.error_message || "La organización del PDF falló");
    }
  });

  if (finalStatus.status !== "completed") {
    throw new Error(finalStatus.error_message || "La organización del PDF no se completó");
  }

  const blob = await downloadResult(jobId, "pdf");
  const filename = `${fileNameBase}_organized.pdf`;

  return { blob, filename, jobId };
}

interface ExecutePdfProtectOptions {
  file: File;
  inputFormat: string;
  fileNameBase: string;
  config: ToolConfig;
  onProgress?: (stage: "uploading" | "processing", progress: number) => void;
}

async function executePdfProtect({
  file,
  inputFormat,
  fileNameBase,
  config,
  onProgress,
}: ExecutePdfProtectOptions): Promise<ActionResult> {
  const outputFormat = config.outputFormat || "pdf";

  const jobId = await processPdfFile(
    file,
    inputFormat,
    "encrypt",
    { user_password: "user" }, // Will be prompted in UI
    outputFormat,
    (stage, progress) => onProgress?.(stage, progress)
  );

  const finalStatus = await pollJobStatus(jobId, (status) => {
    if (status.status === "failed") {
      throw new Error(status.error_message || "La protección del PDF falló");
    }
  });

  if (finalStatus.status !== "completed") {
    throw new Error(finalStatus.error_message || "La protección del PDF no se completó");
  }

  const blob = await downloadResult(jobId, outputFormat);
  const filename = `${fileNameBase}_protected.${outputFormat}`;

  return { blob, filename, jobId };
}

interface ExecuteAudioExtractOptions {
  file: File;
  inputFormat: string;
  fileNameBase: string;
  config: ToolConfig;
  onProgress?: (stage: "uploading" | "processing", progress: number) => void;
}

async function executeAudioExtract({
  file,
  inputFormat,
  fileNameBase,
  config,
  onProgress,
}: ExecuteAudioExtractOptions): Promise<ActionResult> {
  const outputFormat = config.outputFormat || "mp3";

  const jobId = await processPdfFile(
    file,
    inputFormat,
    "extract-audio",
    { output_format: outputFormat },
    outputFormat,
    (stage, progress) => onProgress?.(stage, progress)
  );

  const finalStatus = await pollJobStatus(jobId, (status) => {
    if (status.status === "failed") {
      throw new Error(status.error_message || "La extracción de audio falló");
    }
  });

  if (finalStatus.status !== "completed") {
    throw new Error(finalStatus.error_message || "La extracción de audio no se completó");
  }

  const blob = await downloadResult(jobId, outputFormat);
  const filename = `${fileNameBase}.${outputFormat}`;

  return { blob, filename, jobId };
}

interface ExecuteTrimOptions {
  file: File;
  inputFormat: string;
  fileNameBase: string;
  config: ToolConfig;
  onProgress?: (stage: "uploading" | "processing", progress: number) => void;
}

async function executeTrim({
  file,
  inputFormat,
  fileNameBase,
  config,
  onProgress,
}: ExecuteTrimOptions): Promise<ActionResult> {
  const outputFormat = config.outputFormat || "mp3";

  const jobId = await processPdfFile(
    file,
    inputFormat,
    "trim",
    { start_time: 0, end_time: 60 },
    outputFormat,
    (stage, progress) => onProgress?.(stage, progress)
  );

  const finalStatus = await pollJobStatus(jobId, (status) => {
    if (status.status === "failed") {
      throw new Error(status.error_message || "El trim falló");
    }
  });

  if (finalStatus.status !== "completed") {
    throw new Error(finalStatus.error_message || "El trim no se completó");
  }

  const blob = await downloadResult(jobId, outputFormat);
  const filename = `${fileNameBase}_trimmed.${outputFormat}`;

  return { blob, filename, jobId };
}

interface ExecuteNormalizeOptions {
  file: File;
  inputFormat: string;
  fileNameBase: string;
  config: ToolConfig;
  onProgress?: (stage: "uploading" | "processing", progress: number) => void;
}

async function executeNormalize({
  file,
  inputFormat,
  fileNameBase,
  config,
  onProgress,
}: ExecuteNormalizeOptions): Promise<ActionResult> {
  const outputFormat = config.outputFormat || "mp3";

  const jobId = await processPdfFile(
    file,
    inputFormat,
    "normalize",
    {},
    outputFormat,
    (stage, progress) => onProgress?.(stage, progress)
  );

  const finalStatus = await pollJobStatus(jobId, (status) => {
    if (status.status === "failed") {
      throw new Error(status.error_message || "La normalización falló");
    }
  });

  if (finalStatus.status !== "completed") {
    throw new Error(finalStatus.error_message || "La normalización no se completó");
  }

  const blob = await downloadResult(jobId, outputFormat);
  const filename = `${fileNameBase}_normalized.${outputFormat}`;

  return { blob, filename, jobId };
}

export async function cancelAction(jobId: string): Promise<void> {
  await cancelJob(jobId, { reason: "User cancelled" });
}
