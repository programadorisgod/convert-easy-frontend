"use client";

import {
  ChevronRight,
  Download,
  Info,
  AlertCircle,
  Sparkles,
  Loader2,
  X,
  GripVertical,
} from "lucide-react";
import { sileo } from "sileo";

import { cn } from "@/lib/utils";
import {
  getActionsForCategory,
  getConversionOptions,
} from "@/lib/file-actions";
import { createStoredFileInfo } from "@/lib/file-utils";
import { getFile, storeFile } from "@/lib/file-store";
import {
  convertFile,
  downloadResult,
  cancelJob,
  pollJobStatus,
  processImageFile,
  processPdfFile,
  createUploadedJob,
  queuePdfMergeFromJobs,
  processImagesToPdf,
  convertXmlToJson,
  convertXmlToYaml,
  convertXmlToHtml,
  processVideoFile,
} from "@/lib/api-service";
import type { JobStatus, CompressImageRequest } from "@/types/api";
import { AudioOptions, type AudioParams } from "@/components/audio/audio-options";
import { VideoOptions, type VideoParams } from "@/components/video/video-options";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { ImageCropDialog } from "@/components/editor/image-crop-dialog";
import type {
  FileCategory,
  ConversionOption,
  StoredFileInfo,
} from "@/types/file";
import { useState } from "react";

interface BackgroundJob {
  id: string;
  jobId: string;
  label: string;
  status: "processing" | "downloading" | "failed" | "cancelling";
}

interface MergeSourceFile {
  id: string;
  file: File;
  isCurrent?: boolean;
}

interface ActionSidebarProps {
  category: FileCategory;
  fileName: string;
  fileSize: number;
  fileId: string;
  inputFormat: string;
  onActionSelect?: (
    actionId: string,
    options?: Record<string, unknown>,
  ) => void;
  onConversionComplete?: (fileName: string | null) => void;
  onFileUpdate?: (fileInfo: StoredFileInfo) => void;
  className?: string;
}

export function ActionSidebar({
  category,
  fileName,
  fileSize,
  fileId,
  inputFormat,
  onActionSelect,
  onConversionComplete,
  onFileUpdate,
  className,
}: ActionSidebarProps) {
  const [selectedAction, setSelectedAction] = useState<string | null>(null);
  const [showConvertDialog, setShowConvertDialog] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState<string>("");
  const [audioParams, setAudioParams] = useState<AudioParams>({});
  const [videoParams, setVideoParams] = useState<VideoParams>({});
  const [showCropDialog, setShowCropDialog] = useState(false);

  // Compress dialog state
  const [showCompressDialog, setShowCompressDialog] = useState(false);
  const [compressLevel, setCompressLevel] = useState<
    "low" | "balanced" | "strong"
  >("balanced");
  const [compressFormat, setCompressFormat] = useState<string>("jpg");

  // Watermark dialog state
  const [showWatermarkDialog, setShowWatermarkDialog] = useState(false);
  const [watermarkType, setWatermarkType] = useState<"text" | "logo">("text");
  const [watermarkText, setWatermarkText] = useState<string>("© 2026 MyBrand");
  const [watermarkPosition, setWatermarkPosition] = useState<
    | "top-left"
    | "top-right"
    | "center"
    | "bottom-left"
    | "bottom-right"
    | "diagonal"
  >("bottom-right");
  const [watermarkOpacity, setWatermarkOpacity] = useState<number>(0.7);
  const [watermarkFontSize, setWatermarkFontSize] = useState<number>(40);
  const [watermarkColor, setWatermarkColor] = useState<string>("white");
  const [watermarkFormat, setWatermarkFormat] = useState<string>("jpg");
  const [showMergeOrderDialog, setShowMergeOrderDialog] = useState(false);
  const [mergeSourceFiles, setMergeSourceFiles] = useState<MergeSourceFile[]>(
    [],
  );
  const [draggingMergeFileId, setDraggingMergeFileId] = useState<string | null>(
    null,
  );
  const [isPreparingMerge, setIsPreparingMerge] = useState(false);
  const [showImagesToPdfDialog, setShowImagesToPdfDialog] = useState(false);
  const [imagesToPdfFiles, setImagesToPdfFiles] = useState<MergeSourceFile[]>(
    [],
  );
  const [draggingImagesToPdfId, setDraggingImagesToPdfId] = useState<
    string | null
  >(null);
  const [isPreparingImagesToPdf, setIsPreparingImagesToPdf] = useState(false);

  // Conversion state (shared by all operations: convert, compress, remove-bg, etc.)
  const [isConverting, setIsConverting] = useState(false);
  const [currentOperation, setCurrentOperation] = useState<string | null>(null);
  const [conversionStatus, setConversionStatus] = useState<JobStatus | null>(
    null,
  );
  const [currentJobId, setCurrentJobId] = useState<string | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [convertedFileName, setConvertedFileName] = useState<string | null>(
    null,
  );
  const [isDownloading, setIsDownloading] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isLocalDownloadReady, setIsLocalDownloadReady] = useState(false);
  const [localDownloadFileName, setLocalDownloadFileName] = useState<
    string | null
  >(null);
  const [cancellingBgJobs, setCancellingBgJobs] = useState<string[]>([]);

  // Background jobs (compress, remove-bg, watermark) — non-blocking
  const [backgroundJobs, setBackgroundJobs] = useState<BackgroundJob[]>([]);

  const addBgJob = (jobId: string, label: string) =>
    setBackgroundJobs((prev) => [
      ...prev,
      { id: jobId, jobId, label, status: "processing" },
    ]);

  const updateBgJob = (jobId: string, status: BackgroundJob["status"]) =>
    setBackgroundJobs((prev) =>
      prev.map((j) => (j.id === jobId ? { ...j, status } : j)),
    );

  const removeBgJob = (jobId: string) =>
    setBackgroundJobs((prev) => prev.filter((j) => j.id !== jobId));

  const handleCancelBackgroundJob = async (job: BackgroundJob) => {
    if (job.status === "downloading" || cancellingBgJobs.includes(job.id)) {
      return;
    }

    setCancellingBgJobs((prev) => [...prev, job.id]);
    updateBgJob(job.id, "cancelling");

    try {
      await cancelJob(job.jobId, { reason: "User cancelled" });
      removeBgJob(job.id);

      sileo.info({
        title: "Proceso cancelado",
        description: `Se canceló: ${job.label}`,
        icon: <X className="size-3.5" />,
        roundness: 16,
        duration: 3000,
      });
    } catch (error) {
      updateBgJob(job.id, "processing");

      sileo.error({
        title: "Error al cancelar",
        description:
          error instanceof Error
            ? error.message
            : "No se pudo cancelar el proceso.",
        icon: <AlertCircle className="size-3.5" />,
        roundness: 16,
        duration: 5000,
      });
    } finally {
      setCancellingBgJobs((prev) => prev.filter((id) => id !== job.id));
    }
  };

  const actions = getActionsForCategory(category, inputFormat);
  const conversionOptions = getConversionOptions(category, inputFormat);
  const currentFile = getFile(fileId);

  const parsePageNumbers = (value: string): number[] =>
    value
      .split(",")
      .map((item) => Number(item.trim()))
      .filter((num) => Number.isInteger(num) && num > 0);

  const clearMergeSourceFiles = () => {
    setMergeSourceFiles([]);
  };

  const selectPdfFiles = (): Promise<File[]> =>
    new Promise((resolve) => {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = "application/pdf,.pdf";
      input.multiple = true;

      input.onchange = () => {
        const files = Array.from(input.files ?? []);
        resolve(files);
      };

      input.click();
    });

  const reorderMergeFiles = (fromId: string, toId: string) => {
    if (fromId === toId) return;

    setMergeSourceFiles((prev) => {
      const fromIndex = prev.findIndex((item) => item.id === fromId);
      const toIndex = prev.findIndex((item) => item.id === toId);

      if (fromIndex < 0 || toIndex < 0) {
        return prev;
      }

      const next = [...prev];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return next;
    });
  };

  const handlePdfMerge = async () => {
    if (!currentFile) {
      sileo.error({
        title: "File not found",
        description: "Could not find the current PDF in memory.",
        icon: <AlertCircle className="size-3.5" />,
        roundness: 16,
        duration: 4500,
      });
      return;
    }

    const selectedFiles = await selectPdfFiles();
    if (selectedFiles.length === 0) {
      return;
    }

    const invalidFiles = selectedFiles.filter(
      (file) => !file.name.toLowerCase().endsWith(".pdf"),
    );

    if (invalidFiles.length > 0) {
      sileo.error({
        title: "Invalid files",
        description: "Please select PDF files only.",
        icon: <AlertCircle className="size-3.5" />,
        roundness: 16,
        duration: 4500,
      });
      return;
    }

    const nextMergeSources: MergeSourceFile[] = [
      {
        id: crypto.randomUUID(),
        file: currentFile,
        isCurrent: true,
      },
      ...selectedFiles.map((file) => ({
        id: crypto.randomUUID(),
        file,
      })),
    ];

    setMergeSourceFiles(nextMergeSources);
    setShowMergeOrderDialog(true);
  };

  const handleConfirmMergeOrder = async () => {
    if (mergeSourceFiles.length === 0 || isPreparingMerge) {
      return;
    }

    try {
      setIsPreparingMerge(true);

      sileo.info({
        title: "Preparing merge",
        description: "Uploading PDFs in selected order...",
        icon: <Sparkles className="size-3.5" />,
        roundness: 16,
        duration: 3500,
      });

      const orderedJobIds: string[] = [];
      for (const source of mergeSourceFiles) {
        const jobId = await createUploadedJob(source.file, "pdf", "pdf");
        orderedJobIds.push(jobId);
      }

      if (orderedJobIds.length < 2) {
        throw new Error("Select at least one additional PDF to merge.");
      }

      const [primaryJobId, ...sourceJobIds] = orderedJobIds;
      const mergeJobId = await queuePdfMergeFromJobs(
        primaryJobId,
        sourceJobIds,
      );

      setShowMergeOrderDialog(false);
      clearMergeSourceFiles();
      setDraggingMergeFileId(null);
      addBgJob(mergeJobId, "Merge PDFs");

      const finalStatus = await pollJobStatus(mergeJobId, (status) => {
        if (status.status === "failed") updateBgJob(mergeJobId, "failed");
      });

      if (finalStatus.status === "completed") {
        updateBgJob(mergeJobId, "downloading");
        const fileBaseName =
          fileName.split(".").slice(0, -1).join(".") || fileName;
        const newFileName = `${fileBaseName}_merge.pdf`;

        sileo.success({
          title: "PDF ready",
          description: "The file will download automatically.",
          icon: <Sparkles className="size-3.5" />,
          roundness: 16,
          duration: 5000,
        });

        const blob = await downloadResult(mergeJobId, "pdf");
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = newFileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        removeBgJob(mergeJobId);

        // Keep the blob URL alive so the download button doesn't re-fetch the backend (already cleaned up)
        setDownloadUrl(url);

        // Activate sidebar download button with the merged result
        setCurrentJobId(mergeJobId);
        setConversionStatus("completed");
        setSelectedFormat("pdf");
        setConvertedFileName(newFileName);
        onConversionComplete?.(newFileName);
      } else if (finalStatus.status === "failed") {
        sileo.error({
          title: "Merge error",
          description:
            finalStatus.error_message || "Could not merge the selected PDFs.",
          icon: <AlertCircle className="size-3.5" />,
          roundness: 16,
          duration: 6000,
        });
        removeBgJob(mergeJobId);
      }
    } catch (error) {
      sileo.error({
        title: "Merge error",
        description:
          error instanceof Error
            ? error.message
            : "Could not upload selected PDFs for merging.",
        icon: <AlertCircle className="size-3.5" />,
        roundness: 16,
        duration: 6000,
      });
    } finally {
      setIsPreparingMerge(false);
    }
  };

  const selectImageFiles = (): Promise<File[]> =>
    new Promise((resolve) => {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = "image/*";
      input.multiple = true;

      input.onchange = () => {
        const files = Array.from(input.files ?? []);
        resolve(files);
      };

      input.click();
    });

  // Image -> PDF: current image is page 1, extra images are added pages.
  const startImagesToPdf = () => {
    if (!currentFile) {
      sileo.error({
        title: "File not found",
        description: "Could not find the current image in memory.",
        icon: <AlertCircle className="size-3.5" />,
        roundness: 16,
        duration: 4500,
      });
      return;
    }

    // Open the dialog with the current image already as page 1. The user
    // decides whether to add more images via "+ Agregar imágenes" or just
    // generate the PDF directly. Do NOT auto-open the file picker.
    setImagesToPdfFiles([
      {
        id: crypto.randomUUID(),
        file: currentFile,
        isCurrent: true,
      },
    ]);
    setShowImagesToPdfDialog(true);
  };

  const addMoreImages = async () => {
    const selectedFiles = await selectImageFiles();
    if (selectedFiles.length === 0) {
      return;
    }

    setImagesToPdfFiles((prev) => [
      ...prev,
      ...selectedFiles.map((file) => ({ id: crypto.randomUUID(), file })),
    ]);
  };

  const removeImage = (id: string) => {
    setImagesToPdfFiles((prev) => prev.filter((item) => item.id !== id));
  };

  const reorderImagesToPdf = (fromId: string, toId: string) => {
    if (fromId === toId) return;

    setImagesToPdfFiles((prev) => {
      const fromIndex = prev.findIndex((item) => item.id === fromId);
      const toIndex = prev.findIndex((item) => item.id === toId);

      if (fromIndex < 0 || toIndex < 0) {
        return prev;
      }

      const next = [...prev];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return next;
    });
  };

  const handleConfirmImagesToPdf = async () => {
    if (imagesToPdfFiles.length === 0 || isPreparingImagesToPdf) {
      return;
    }

    try {
      setIsPreparingImagesToPdf(true);

      sileo.info({
        title: "Armando PDF",
        description: "Subiendo imágenes y generando el PDF...",
        icon: <Sparkles className="size-3.5" />,
        roundness: 16,
        duration: 3500,
      });

      const orderedFiles = imagesToPdfFiles.map(
        (source) => source.file,
      );
      const jobId = await processImagesToPdf(orderedFiles);

      setShowImagesToPdfDialog(false);
      setImagesToPdfFiles([]);
      setDraggingImagesToPdfId(null);
      addBgJob(jobId, "Imagen a PDF");

      const finalStatus = await pollJobStatus(jobId, (status) => {
        if (status.status === "failed") updateBgJob(jobId, "failed");
      });

      if (finalStatus.status === "completed") {
        updateBgJob(jobId, "downloading");
        const fileBaseName =
          fileName.split(".").slice(0, -1).join(".") || fileName;
        const newFileName = `${fileBaseName}.pdf`;

        sileo.success({
          title: "¡PDF listo!",
          description: "El archivo se descargará automáticamente.",
          icon: <Sparkles className="size-3.5" />,
          roundness: 16,
          duration: 5000,
        });

        const blob = await downloadResult(jobId, "pdf");
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = newFileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        removeBgJob(jobId);
        setDownloadUrl(url);
        setCurrentJobId(jobId);
        setConversionStatus("completed");
        setSelectedFormat("pdf");
        setConvertedFileName(newFileName);
        onConversionComplete?.(newFileName);
      } else if (finalStatus.status === "failed") {
        sileo.error({
          title: "Error al generar el PDF",
          description:
            finalStatus.error_message || "No se pudo armar el PDF.",
          icon: <AlertCircle className="size-3.5" />,
          roundness: 16,
          duration: 6000,
        });
        removeBgJob(jobId);
      }
    } catch (error) {
      sileo.error({
        title: "Error al generar el PDF",
        description:
          error instanceof Error
            ? error.message
            : "No se pudieron subir las imágenes.",
        icon: <AlertCircle className="size-3.5" />,
        roundness: 16,
        duration: 6000,
      });
    } finally {
      setIsPreparingImagesToPdf(false);
    }
  };

  const runPdfOperation = async (
    operation: Parameters<typeof processPdfFile>[2],
    label: string,
    params: Record<string, unknown>,
    outputFormat: string = "pdf",
    downloadExtension?: string,
  ) => {
    if (!currentFile) {
      sileo.error({
        title: "File not found",
        description: "Could not find the PDF in memory.",
        icon: <AlertCircle className="size-3.5" />,
        roundness: 16,
        duration: 4000,
      });
      return;
    }

    try {
      sileo.info({
        title: "Processing PDF",
        description: "You can keep using the app while this runs.",
        icon: <Sparkles className="size-3.5" />,
        roundness: 16,
        duration: 4500,
      });

      const jobId = await processPdfFile(
        currentFile,
        inputFormat,
        operation,
        params,
        outputFormat,
      );

      addBgJob(jobId, label);

      const finalStatus = await pollJobStatus(jobId, (status) => {
        if (status.status === "failed") updateBgJob(jobId, "failed");
      });

      if (finalStatus.status === "completed") {
        updateBgJob(jobId, "downloading");
        const fileBaseName =
          fileName.split(".").slice(0, -1).join(".") || fileName;
        const suffix = operation.replaceAll("-", "_");
        const finalExtension = downloadExtension || outputFormat;
        const newFileName = `${fileBaseName}_${suffix}.${finalExtension}`;

        sileo.success({
          title: "PDF ready",
          description: "The file will download automatically.",
          icon: <Sparkles className="size-3.5" />,
          roundness: 16,
          duration: 5000,
        });

        const blob = await downloadResult(jobId, finalExtension);
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = newFileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        removeBgJob(jobId);

        // Keep the blob URL alive so the download button doesn't re-fetch the backend (already cleaned up)
        setDownloadUrl(url);

        // Activate sidebar download button with the result from the backend
        setCurrentJobId(jobId);
        setConversionStatus("completed");
        setSelectedFormat(finalExtension);
        setConvertedFileName(newFileName);
        onConversionComplete?.(newFileName);
      } else if (finalStatus.status === "failed") {
        sileo.error({
          title: "PDF error",
          description:
            finalStatus.error_message ||
            "Could not complete the PDF operation.",
          icon: <AlertCircle className="size-3.5" />,
          roundness: 16,
          duration: 6500,
        });
        removeBgJob(jobId);
      }
    } catch (error) {
      sileo.error({
        title: "PDF error",
        description:
          error instanceof Error
            ? error.message
            : "Could not execute the PDF operation.",
        icon: <AlertCircle className="size-3.5" />,
        roundness: 16,
        duration: 6500,
      });
    }
  };

  const handleActionClick = (actionId: string) => {
    setSelectedAction(actionId);

    if (actionId === "convert") {
      setShowConvertDialog(true);
      return;
    }

    if (actionId === "compress") {
      setShowCompressDialog(true);
      return;
    }

    if (actionId === "crop") {
      if (category === "image") {
        setShowCropDialog(true);
        return;
      }

      sileo.info({
        title: "Crop para video próximamente",
        description:
          "El recorte interactivo ya está listo para imágenes; para video lo conectaremos aparte.",
        icon: <Info className="size-3.5" />,
        roundness: 16,
        duration: 3500,
      });
      return;
    }

    if (actionId === "remove-bg") {
      sileo.info({
        title: "Available soon",
        description: "Remove Background will be available in a future update.",
        icon: <Info className="size-3.5" />,
        roundness: 16,
        duration: 3500,
      });
      return;
    }

    if (actionId === "extract-audio") {
      void handleExtractAudio();
      return;
    }

    if (actionId === "watermark") {
      setShowWatermarkDialog(true);
      return;
    }

    if (actionId === "pdf-merge") {
      void handlePdfMerge();
      return;
    }

    if (actionId === "pdf-split") {
      const startRaw = window.prompt("Start page (inclusive):", "1");
      const endRaw = window.prompt("End page (inclusive):", "2");
      if (!startRaw || !endRaw) return;

      const startPage = Number(startRaw);
      const endPage = Number(endRaw);

      if (
        !Number.isInteger(startPage) ||
        !Number.isInteger(endPage) ||
        startPage < 1 ||
        endPage < startPage
      ) {
        sileo.error({
          title: "Invalid range",
          description: "Please enter a valid page range (start <= end).",
          icon: <AlertCircle className="size-3.5" />,
          roundness: 16,
          duration: 4500,
        });
        return;
      }

      runPdfOperation(
        "split-range",
        "Split PDF",
        {
          start_page: startPage,
          end_page: endPage,
        },
        "pdf",
        "zip",
      );
      return;
    }

    if (actionId === "pdf-extract-pages") {
      const raw = window.prompt("Pages to extract (e.g. 1,3,5):", "1");
      if (!raw) return;

      const pageNumbers = parsePageNumbers(raw);
      if (pageNumbers.length === 0) {
        sileo.error({
          title: "Invalid pages",
          description: "Please enter at least one valid page number.",
          icon: <AlertCircle className="size-3.5" />,
          roundness: 16,
          duration: 4500,
        });
        return;
      }

      runPdfOperation("extract-pages", "Extract Pages", {
        page_numbers: pageNumbers,
      });
      return;
    }

    if (actionId === "pdf-delete-pages") {
      const raw = window.prompt("Pages to delete (e.g. 2,4):", "2");
      if (!raw) return;
      const pageNumbers = parsePageNumbers(raw);
      if (pageNumbers.length === 0) return;
      runPdfOperation("delete-pages", "Delete pages", {
        page_numbers: pageNumbers,
      });
      return;
    }

    if (actionId === "pdf-metadata") {
      const title = window.prompt("PDF title:", "");
      const author = window.prompt("Author:", "");
      const subject = window.prompt("Subject:", "");
      const metadata: Record<string, string> = {};
      if (title) metadata.Title = title;
      if (author) metadata.Author = author;
      if (subject) metadata.Subject = subject;
      if (Object.keys(metadata).length === 0) return;
      runPdfOperation("metadata", "Update metadata", { metadata });
      return;
    }

    if (actionId === "pdf-encrypt") {
      const userPassword = window.prompt("Open password:", "");
      if (!userPassword) return;
      const ownerPassword = window.prompt("Owner password (optional):", "");
      runPdfOperation("encrypt", "Encrypt PDF", {
        user_password: userPassword,
        owner_password: ownerPassword || undefined,
      });
      return;
    }

    if (actionId === "pdf-decrypt") {
      const password = window.prompt("Current PDF password:", "");
      if (!password) return;
      runPdfOperation("decrypt", "Decrypt PDF", { password });
      return;
    }

    if (actionId === "pdf-add-image") {
      sileo.info({
        title: "Próximamente",
        description: "Insertar imágenes en PDF estará disponible en una actualización futura.",
        icon: <Info className="size-3.5" />,
        roundness: 16,
        duration: 3500,
      });
      return;
    }

    if (actionId === "pdf-add-annotation") {
      const pageRaw = window.prompt("Page number (1-based):", "1");
      const text = window.prompt("Annotation text:", "Note");
      if (!pageRaw || !text) return;
      runPdfOperation("add-annotation", "Add annotation", {
        page_number: Number(pageRaw),
        text,
        x: 72,
        y: 72,
      });
      return;
    }

    // For other actions, just show a toast for now (placeholder)
    sileo.info({
      title: `${actionId.charAt(0).toUpperCase() + actionId.slice(1)} selected`,
      description: "This feature will be available soon.",
      icon: <Info className="size-3.5" />,
      roundness: 16,
      autopilot: {
        expand: 200,
        collapse: 2500,
      },
      duration: 3500,
    });

    if (onActionSelect) {
      onActionSelect(actionId);
    }
  };

  const handleConvert = async () => {
    if (!selectedFormat) {
      sileo.error({
        title: "Select a format",
        description: "Please select a target format for your file.",
        icon: <AlertCircle className="size-3.5" />,
        roundness: 16,
        autopilot: {
          expand: 200,
          collapse: 2500,
        },
        duration: 3500,
      });
      return;
    }

    // Get file from store
    const file = getFile(fileId);
    if (!file) {
      sileo.error({
        title: "File not found",
        description:
          "Could not find the file in memory. Please try uploading it again.",
        icon: <AlertCircle className="size-3.5" />,
        roundness: 16,
        duration: 4000,
      });
      return;
    }

    // Handle XML conversion with dedicated API
    if (inputFormat.toLowerCase() === "xml") {
      setShowConvertDialog(false);

      sileo.info({
        title: "Convirtiendo XML",
        description: "Procesando tu archivo XML...",
        icon: <Sparkles className="size-3.5" />,
        roundness: 16,
        duration: 4000,
      });

      setIsConverting(true);

      try {
        let result: { blob: Blob; filename: string };

        switch (selectedFormat.toLowerCase()) {
          case "json":
            result = await convertXmlToJson(file, {
              preserve_attributes: false,
              always_as_list: false,
            });
            break;
          case "yaml":
            result = await convertXmlToYaml(file, {
              indent: 2,
              flow_style: false,
              preserve_xml_declaration: true,
            });
            break;
          case "html":
            result = await convertXmlToHtml(file, {
              template: "table",
            });
            break;
          default:
            throw new Error(`Unsupported XML target format: ${selectedFormat}`);
        }

        // Download the converted file
        const url = URL.createObjectURL(result.blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = result.filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 1000);

        setIsConverting(false);

        sileo.success({
          title: "¡Conversión completada!",
          description: `${result.filename} se ha descargado.`,
          icon: <Sparkles className="size-3.5" />,
          roundness: 16,
          duration: 5000,
        });

        if (onActionSelect) {
          onActionSelect("convert", { targetFormat: selectedFormat });
        }
        return;
      } catch (error) {
        console.error("XML conversion error:", error);

        let errorMessage = "Could not convert the XML file";

        if (error instanceof Error) {
          if (
            error.message.includes("NetworkError") ||
            error.message.includes("fetch")
          ) {
            errorMessage =
              "Could not connect to the server. Please check your internet connection or try again later.";
          } else {
            errorMessage = error.message;
          }
        }

        sileo.error({
          title: "Error en la conversión XML",
          description: errorMessage,
          icon: <AlertCircle className="size-3.5" />,
          roundness: 16,
          duration: 8000,
        });
        setIsConverting(false);
        return;
      }
    }

    // Continue with regular conversion (non-XML)
    // Image -> PDF combines the current image plus additional images into one PDF.
    if (category === "image" && selectedFormat.toLowerCase() === "pdf") {
      setShowConvertDialog(false);
      startImagesToPdf();
      return;
    }

    const useDocumentEndpoint = category === "document";

    setShowConvertDialog(false);
    const isLargeFile = fileSize > 10 * 1024 * 1024; // 10MB

    // Para archivos pequeños (NO documentos): proceso simple y directo (bloqueante)
    // Los documentos SIEMPRE usan background jobs sin importar tamaño
    if (!isLargeFile && category !== "document") {
      sileo.info({
        title: "Procesando archivo",
        description:
          "Deja que nos encarguemos de todo, pronto tendrás tu archivo convertido.",
        icon: <Sparkles className="size-3.5" />,
        roundness: 16,
        autopilot: {
          expand: 0,
          collapse: 2500,
        },
        duration: 3000,
      });

      setIsConverting(true);
      setConversionStatus("processing");

      try {
        let jobId: string;

        if (category === "video") {
          const outputFormatMatch = selectedFormat; // Already the target format
          jobId = await processVideoFile(
            file,
            inputFormat,
            outputFormatMatch,
            videoParams as Record<string, unknown> | undefined,
          );
        } else {
          jobId = await convertFile(
            file,
            inputFormat,
            [selectedFormat],
            () => {},
            {
              useDocumentEndpoint,
              preferredDocumentEngine: "auto",
            },
          );
        }

        setCurrentJobId(jobId);

        // Poll for status updates (silently for small files)
        await pollJobStatus(
          jobId,
          (status) => {
            setConversionStatus(status.status);

            if (status.status === "completed") {
              const newFileName = `${fileName.split(".")[0]}.${selectedFormat}`;
              setConvertedFileName(newFileName);
              onConversionComplete?.(newFileName);
            } else if (status.status === "failed") {
              sileo.error({
                title: "Error en la conversión",
                description:
                  status.error_message ||
                  "Ocurrió un error al procesar tu archivo. Por favor, intenta nuevamente.",
                icon: <AlertCircle className="size-3.5" />,
                roundness: 16,
                autopilot: {
                  expand: 0,
                  collapse: 3000,
                },
                duration: 6000,
              });
            }
          },
          1000, // Poll every second
          300, // Max 5 minutes
        );
      } catch (error) {
        console.error("Conversion error:", error);

        let errorMessage = "Could not convert the file";

        if (error instanceof Error) {
          if (
            error.message.includes("NetworkError") ||
            error.message.includes("fetch")
          ) {
            errorMessage =
              "Could not connect to the server. Please check your internet connection or try again later.";
          } else {
            errorMessage = error.message;
          }
        }

        sileo.error({
          title: "🚨 Conversion error",
          description: errorMessage,
          icon: <AlertCircle className="size-3.5" />,
          roundness: 16,
          autopilot: {
            expand: 0,
            collapse: 4000,
          },
          duration: 8000,
        });
        setIsConverting(false);
        setConversionStatus(null);
        setCurrentJobId(null);
      }

      if (onActionSelect) {
        onActionSelect("convert", { targetFormat: selectedFormat });
      }
      return;
    }

    // Para documentos (cualquier tamaño) o archivos grandes: procesador en segundo plano con descarga automática
    setShowConvertDialog(false);

    try {
      sileo.info({
        title: "Procesando archivo",
        description:
          "Puedes seguir utilizando la app, te avisaremos cuando esté listo.",
        icon: <Sparkles className="size-3.5" />,
        roundness: 16,
        duration: 5000,
      });

      // Start conversion (upload + trigger)
      const jobId = await convertFile(
        file,
        inputFormat,
        [selectedFormat],
        () => {}, // No progress callback for large files
        {
          useDocumentEndpoint,
          preferredDocumentEngine: "auto",
        },
      );

      const outputFormat = selectedFormat;
      addBgJob(jobId, `Convertir a ${outputFormat.toUpperCase()}`);

      // Poll for status updates in background
      const finalStatus = await pollJobStatus(jobId, (status) => {
        if (status.status === "failed") updateBgJob(jobId, "failed");
      });

      if (finalStatus.status === "completed") {
        updateBgJob(jobId, "downloading");
        const newFileName = `${fileName.split(".")[0]}.${outputFormat}`;

        sileo.success({
          title: "¡Tu archivo está listo!",
          description: "El archivo se descargará automáticamente.",
          icon: <Sparkles className="size-3.5" />,
          roundness: 16,
          duration: 5000,
        });

        const blob = await downloadResult(jobId, outputFormat);
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = newFileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        removeBgJob(jobId);

        // Keep the blob URL alive so the download button doesn't re-fetch the backend (already cleaned up)
        setDownloadUrl(url);

        // Activate sidebar download button with the converted result
        setCurrentJobId(jobId);
        setConversionStatus("completed");
        setSelectedFormat(outputFormat);
        setConvertedFileName(newFileName);
        onConversionComplete?.(newFileName);
      } else if (finalStatus.status === "failed") {
        sileo.error({
          title: "Error en la conversión",
          description:
            finalStatus.error_message || "No se pudo convertir el archivo.",
          icon: <AlertCircle className="size-3.5" />,
          roundness: 16,
          duration: 6000,
        });
        removeBgJob(jobId);
      }
    } catch (error) {
      console.error("Conversion error:", error);
      sileo.error({
        title: "Error en la conversión",
        description:
          error instanceof Error
            ? error.message
            : "No se pudo convertir el archivo",
        icon: <AlertCircle className="size-3.5" />,
        roundness: 16,
        duration: 6000,
      });
    }

    if (onActionSelect) {
      onActionSelect("convert", { targetFormat: selectedFormat });
    }
  };

  const handleCompress = async () => {
    if (!compressFormat) {
      sileo.error({
        title: "Selecciona un formato",
        description: "Por favor selecciona un formato de salida.",
        icon: <AlertCircle className="size-3.5" />,
        roundness: 16,
        duration: 3500,
      });
      return;
    }

    // Get file from store
    const file = getFile(fileId);
    if (!file) {
      sileo.error({
        title: "Archivo no encontrado",
        description: "No se pudo encontrar el archivo en memoria.",
        icon: <AlertCircle className="size-3.5" />,
        roundness: 16,
        duration: 4000,
      });
      return;
    }

    setShowCompressDialog(false);

    if (onActionSelect) {
      onActionSelect("compress", {
        level: compressLevel,
        format: compressFormat,
      });
    }

    try {
      sileo.info({
        title: "Procesando archivo",
        description:
          "Puedes seguir utilizando la app, te avisaremos cuando esté listo.",
        icon: <Sparkles className="size-3.5" />,
        roundness: 16,
        duration: 5000,
      });

      const jobId = await processImageFile(file, inputFormat, "compress", {
        output_format: compressFormat,
        level: compressLevel,
        strip_metadata: true,
      });

      const outputFormat = compressFormat;
      addBgJob(jobId, "Comprimir imagen");

      const finalStatus = await pollJobStatus(jobId, (status) => {
        if (status.status === "failed") updateBgJob(jobId, "failed");
      });

      if (finalStatus.status === "completed") {
        updateBgJob(jobId, "downloading");
        const newFileName = `${fileName.split(".")[0]}_compressed.${outputFormat}`;

        sileo.success({
          title: "¡Tu archivo está listo!",
          description: "El archivo se descargará automáticamente.",
          icon: <Sparkles className="size-3.5" />,
          roundness: 16,
          duration: 5000,
        });

        const blob = await downloadResult(jobId, outputFormat);
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = newFileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        removeBgJob(jobId);

        // Keep the blob URL alive so the download button doesn't re-fetch the backend (already cleaned up)
        setDownloadUrl(url);

        // Activate sidebar download button with the compressed result
        setCurrentJobId(jobId);
        setConversionStatus("completed");
        setSelectedFormat(outputFormat);
        setConvertedFileName(newFileName);
        onConversionComplete?.(newFileName);
      } else if (finalStatus.status === "failed") {
        sileo.error({
          title: "Error al comprimir",
          description:
            finalStatus.error_message || "No se pudo comprimir la imagen.",
          icon: <AlertCircle className="size-3.5" />,
          roundness: 16,
          duration: 6000,
        });
        removeBgJob(jobId);
      }
    } catch (error) {
      console.error("Compress error:", error);
      sileo.error({
        title: "Error al comprimir",
        description:
          error instanceof Error
            ? error.message
            : "No se pudo comprimir la imagen",
        icon: <AlertCircle className="size-3.5" />,
        roundness: 16,
        duration: 6000,
      });
    }
  };

  const handleRemoveBackground = async () => {
    const file = getFile(fileId);
    if (!file) {
      sileo.error({
        title: "Archivo no encontrado",
        description: "No se pudo encontrar el archivo en memoria.",
        icon: <AlertCircle className="size-3.5" />,
        roundness: 16,
        duration: 4000,
      });
      return;
    }

    if (onActionSelect) {
      onActionSelect("remove-bg");
    }

    try {
      sileo.info({
        title: "Procesando archivo",
        description:
          "Puedes seguir utilizando la app, te avisaremos cuando esté listo.",
        icon: <Sparkles className="size-3.5" />,
        roundness: 16,
        duration: 5000,
      });

      const jobId = await processImageFile(
        file,
        inputFormat,
        "remove-background",
        {
          output_format: "png",
          model: "u2net",
          alpha_matting: false,
          strip_metadata: true,
        },
      );

      addBgJob(jobId, "Remover fondo");

      const finalStatus = await pollJobStatus(jobId, (status) => {
        if (status.status === "failed") updateBgJob(jobId, "failed");
      });

      if (finalStatus.status === "completed") {
        updateBgJob(jobId, "downloading");
        const newFileName = `${fileName.split(".")[0]}_no_bg.png`;

        sileo.success({
          title: "¡Tu archivo está listo!",
          description: "El archivo se descargará automáticamente.",
          icon: <Sparkles className="size-3.5" />,
          roundness: 16,
          duration: 5000,
        });

        const blob = await downloadResult(jobId, "png");
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = newFileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        removeBgJob(jobId);

        // Keep the blob URL alive so the download button doesn't re-fetch the backend (already cleaned up)
        setDownloadUrl(url);

        // Activate sidebar download button with the result
        setCurrentJobId(jobId);
        setConversionStatus("completed");
        setSelectedFormat("png");
        setConvertedFileName(newFileName);
        onConversionComplete?.(newFileName);
      } else if (finalStatus.status === "failed") {
        sileo.error({
          title: "Error al remover fondo",
          description:
            finalStatus.error_message ||
            "No se pudo remover el fondo de la imagen.",
          icon: <AlertCircle className="size-3.5" />,
          roundness: 16,
          duration: 6000,
        });
        removeBgJob(jobId);
      }
    } catch (error) {
      console.error("Remove background error:", error);
      sileo.error({
        title: "Error al remover fondo",
        description:
          error instanceof Error
            ? error.message
            : "No se pudo remover el fondo",
        icon: <AlertCircle className="size-3.5" />,
        roundness: 16,
        duration: 6000,
      });
    }
  };

  const handleExtractAudio = async () => {
    const file = getFile(fileId);
    if (!file) {
      sileo.error({
        title: "Archivo no encontrado",
        description: "No se pudo encontrar el archivo en memoria.",
        icon: <AlertCircle className="size-3.5" />,
        roundness: 16,
        duration: 4000,
      });
      return;
    }

    if (onActionSelect) {
      onActionSelect("extract-audio");
    }

    try {
      sileo.info({
        title: "Extrayendo audio",
        description:
          "Puedes seguir utilizando la app, te avisaremos cuando esté listo.",
        icon: <Sparkles className="size-3.5" />,
        roundness: 16,
        duration: 5000,
      });

      const jobId = await processVideoFile(file, inputFormat, "mp3", {
        extract_audio: true,
        audio_output_format: "mp3",
        audio_bitrate: "192k",
      });

      addBgJob(jobId, "Extraer audio");

      const finalStatus = await pollJobStatus(jobId, (status) => {
        if (status.status === "failed") updateBgJob(jobId, "failed");
      });

      if (finalStatus.status === "completed") {
        updateBgJob(jobId, "downloading");
        const newFileName = `${fileName.split(".")[0]}.mp3`;

        sileo.success({
          title: "¡Audio extraído!",
          description: "El archivo se descargará automáticamente.",
          icon: <Sparkles className="size-3.5" />,
          roundness: 16,
          duration: 5000,
        });

        const blob = await downloadResult(jobId, "mp3");
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = newFileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        removeBgJob(jobId);

        // Keep the blob URL alive so the download button doesn't re-fetch the backend (already cleaned up)
        setDownloadUrl(url);

        // Activate sidebar download button with the extracted audio
        setCurrentJobId(jobId);
        setConversionStatus("completed");
        setSelectedFormat("mp3");
        setConvertedFileName(newFileName);
        onConversionComplete?.(newFileName);
      } else if (finalStatus.status === "failed") {
        sileo.error({
          title: "Error al extraer audio",
          description:
            finalStatus.error_message ||
            "No se pudo extraer el audio del video.",
          icon: <AlertCircle className="size-3.5" />,
          roundness: 16,
          duration: 6000,
        });
        removeBgJob(jobId);
      }
    } catch (error) {
      console.error("Extract audio error:", error);
      sileo.error({
        title: "Error al extraer audio",
        description:
          error instanceof Error
            ? error.message
            : "No se pudo extraer el audio",
        icon: <AlertCircle className="size-3.5" />,
        roundness: 16,
        duration: 6000,
      });
    }
  };

  const handleWatermark = async () => {
    if (watermarkType === "text" && !watermarkText.trim()) {
      sileo.error({
        title: "Texto requerido",
        description: "Por favor ingresa el texto de la marca de agua.",
        icon: <AlertCircle className="size-3.5" />,
        roundness: 16,
        duration: 3500,
      });
      return;
    }

    const file = getFile(fileId);
    if (!file) {
      sileo.error({
        title: "Archivo no encontrado",
        description: "No se pudo encontrar el archivo en memoria.",
        icon: <AlertCircle className="size-3.5" />,
        roundness: 16,
        duration: 4000,
      });
      return;
    }

    setShowWatermarkDialog(false);

    if (onActionSelect) {
      onActionSelect("watermark", {
        type: watermarkType,
        format: watermarkFormat,
      });
    }

    try {
      sileo.info({
        title: "Procesando archivo",
        description:
          "Puedes seguir utilizando la app, te avisaremos cuando esté listo.",
        icon: <Sparkles className="size-3.5" />,
        roundness: 16,
        duration: 5000,
      });

      const outputFormat = watermarkFormat;
      const jobId = await processImageFile(file, inputFormat, "watermark", {
        output_format: outputFormat,
        type: watermarkType,
        text: watermarkType === "text" ? watermarkText : undefined,
        logo_path: undefined,
        position: watermarkPosition,
        opacity: watermarkOpacity,
        font_size: watermarkFontSize,
        color: watermarkColor,
        margin: 20,
        size_percent: 15,
        strip_metadata: true,
      });

      addBgJob(jobId, "Marca de agua");

      const finalStatus = await pollJobStatus(jobId, (status) => {
        if (status.status === "failed") updateBgJob(jobId, "failed");
      });

      if (finalStatus.status === "completed") {
        updateBgJob(jobId, "downloading");
        const newFileName = `${fileName.split(".")[0]}_watermarked.${outputFormat}`;

        sileo.success({
          title: "¡Tu archivo está listo!",
          description: "El archivo se descargará automáticamente.",
          icon: <Sparkles className="size-3.5" />,
          roundness: 16,
          duration: 5000,
        });

        const blob = await downloadResult(jobId, outputFormat);
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = newFileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        removeBgJob(jobId);

        // Keep the blob URL alive so the download button doesn't re-fetch the backend (already cleaned up)
        setDownloadUrl(url);

        // Activate sidebar download button with the watermarked result
        setCurrentJobId(jobId);
        setConversionStatus("completed");
        setSelectedFormat(outputFormat);
        setConvertedFileName(newFileName);
        onConversionComplete?.(newFileName);
      } else if (finalStatus.status === "failed") {
        sileo.error({
          title: "Error al agregar marca de agua",
          description:
            finalStatus.error_message ||
            "No se pudo agregar la marca de agua a la imagen.",
          icon: <AlertCircle className="size-3.5" />,
          roundness: 16,
          duration: 6000,
        });
        removeBgJob(jobId);
      }
    } catch (error) {
      console.error("Watermark error:", error);
      sileo.error({
        title: "Error al agregar marca de agua",
        description:
          error instanceof Error
            ? error.message
            : "No se pudo agregar la marca de agua",
        icon: <AlertCircle className="size-3.5" />,
        roundness: 16,
        duration: 6000,
      });
    }
  };

  const handleCancelConversion = async () => {
    if (!currentJobId || isCancelling) return;

    setIsCancelling(true);

    try {
      await cancelJob(currentJobId, { reason: "User cancelled" });

      sileo.info({
        title: "Conversión cancelada",
        description: "La conversión ha sido cancelada.",
        icon: <X className="size-3.5" />,
        roundness: 16,
        duration: 3000,
      });

      setIsConverting(false);
      setConversionStatus(null);
      setCurrentJobId(null);
      setIsCancelling(false);
    } catch (error) {
      console.error("Cancel error:", error);

      const errorMessage =
        error instanceof Error
          ? error.message
          : "No se pudo cancelar la conversión";

      sileo.error({
        title: "Error al cancelar",
        description: errorMessage,
        icon: <AlertCircle className="size-3.5" />,
        roundness: 16,
        duration: 4000,
      });

      setIsCancelling(false);
    }
  };

  const handleDownload = async () => {
    if (!currentJobId || !selectedFormat) {
      console.warn("Download blocked:", { currentJobId, selectedFormat, downloadUrl });
      sileo.error({
        title: "No se puede descargar",
        description:
          "Falta información del archivo procesado. Por favor, vuelve a procesar el archivo.",
        icon: <AlertCircle className="size-3.5" />,
        roundness: 16,
        duration: 4000,
      });
      return;
    }

    setIsDownloading(true);

    try {
      // Use cached blob URL if available (backed cleanup after first download)
      const url = downloadUrl || URL.createObjectURL(await downloadResult(currentJobId, selectedFormat));
      setDownloadUrl(url);

      // Trigger download
      const a = document.createElement("a");
      a.href = url;
      a.download = `${fileName.split(".")[0]}.${selectedFormat}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      // Reset state after download
      setTimeout(() => {
        if (url) URL.revokeObjectURL(url);
        setIsConverting(false);
        setConversionStatus(null);
        setCurrentJobId(null);
        setDownloadUrl(null);
        setSelectedFormat("");
        setConvertedFileName(null);
        setCurrentOperation(null);
        setIsDownloading(false);
        onConversionComplete?.(null); // Clear "archivo está listo" message
      }, 1000);
    } catch (error) {
      console.error("Download error:", error);

      const errorMessage =
        error instanceof Error
          ? error.message
          : "No se pudo descargar el archivo";

      sileo.error({
        title: "Error al descargar",
        description: errorMessage,
        icon: <AlertCircle className="size-3.5" />,
        roundness: 16,
        autopilot: {
          expand: 0,
          collapse: 3000,
        },
        duration: 6000,
      });

      setIsDownloading(false);
    }
  };

  const handleDownloadCurrentFile = async () => {
    const file = getFile(fileId);

    if (!file) {
      sileo.error({
        title: "No se puede descargar",
        description:
          "No encontramos la imagen actual en memoria. Vuelve a subirla o reaplica el cambio.",
        icon: <AlertCircle className="size-3.5" />,
        roundness: 16,
        duration: 4000,
      });
      return;
    }

    setIsDownloading(true);

    try {
      const url = URL.createObjectURL(file);
      const anchor = document.createElement("a");

      anchor.href = url;
      anchor.download = file.name;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);

      setTimeout(() => URL.revokeObjectURL(url), 1000);

      sileo.success({
        title: "Descarga iniciada",
        description: `${file.name} se está descargando.`,
        icon: <Download className="size-3.5" />,
        roundness: 16,
        duration: 2500,
      });

      setIsLocalDownloadReady(false);
      setLocalDownloadFileName(null);
    } catch (error) {
      console.error("Current file download error:", error);

      sileo.error({
        title: "Error al descargar",
        description:
          error instanceof Error
            ? error.message
            : "No se pudo descargar la imagen actual.",
        icon: <AlertCircle className="size-3.5" />,
        roundness: 16,
        duration: 5000,
      });
    } finally {
      setIsDownloading(false);
    }
  };

  const getStatusText = () => {
    if (!conversionStatus) return "";

    switch (conversionStatus) {
      case "pending":
        return "Preparing...";
      case "queued":
        return "Queued...";
      case "processing":
        return "Processing your file...";
      case "completed":
        return "Completed!";
      case "failed":
        return "Failed";
      case "cancelled":
        return "Cancelled";
      default:
        return "";
    }
  };

  const isDownloadReady = conversionStatus === "completed" && currentJobId;
  const hasPriorityLocalDownload = isLocalDownloadReady && Boolean(currentFile);
  const canDownloadCurrentFile = Boolean(currentFile) && !isConverting;
  const downloadButtonLabel = hasPriorityLocalDownload
    ? "Descargar imagen recortada"
    : isDownloadReady
      ? "Download Result"
      : category === "image"
        ? "Descargar imagen"
        : "Descargar archivo";
  const handlePrimaryDownload = hasPriorityLocalDownload
    ? handleDownloadCurrentFile
    : isDownloadReady
      ? handleDownload
      : handleDownloadCurrentFile;
  const isDownloadDisabled = hasPriorityLocalDownload
    ? isDownloading
    : isDownloadReady
      ? isDownloading
      : !canDownloadCurrentFile || isDownloading;

  const handleCropApply = async (
    croppedFile: File,
    mode: "avatar" | "image",
  ) => {
    storeFile(fileId, croppedFile);

    const updatedFileInfo = createStoredFileInfo(croppedFile, fileId);
    onFileUpdate?.(updatedFileInfo);
    onConversionComplete?.(null);

    // Reset conversion/download job state so the UI focuses on the new local file.
    setIsConverting(false);
    setConversionStatus(null);
    setCurrentJobId(null);
    setSelectedFormat("");
    setDownloadUrl(null);
    setIsLocalDownloadReady(true);
    setLocalDownloadFileName(croppedFile.name);

    sileo.success({
      title: "Recorte aplicado",
      description:
        mode === "avatar"
          ? "Avatar listo. Descárgalo cuando quieras."
          : "Imagen recortada lista para descargar.",
      icon: <Sparkles className="size-3.5" />,
      roundness: 16,
      duration: 2800,
    });

    onActionSelect?.("crop", {
      mode,
      outputFormat: updatedFileInfo.extension,
    });
  };

  return (
    <>
                <aside className={cn("flex w-72 flex-col overflow-hidden border-r bg-card", className)}>
        <div className="p-4">
          <h2 className="text-sm font-semibold text-foreground">Actions</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Choose what to do with your file
          </p>
        </div>

        <Separator />

        {/* Progress indicator when converting */}
        {isConverting && (
          <>
            <div className="p-4 space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-foreground">
                  {getStatusText()}
                </span>
              </div>

              {(conversionStatus === "processing" ||
                conversionStatus === "queued" ||
                conversionStatus === "pending") && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Processing your file...</span>
                </div>
              )}

              {conversionStatus &&
                !["completed", "failed", "cancelled"].includes(
                  conversionStatus,
                ) && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCancelConversion}
                    disabled={isCancelling}
                    className="w-full gap-2 hover:scale-[1.02] hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 transition-all"
                  >
                    {isCancelling ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Cancelando...
                      </>
                    ) : (
                      <>
                        <X className="h-4 w-4" />
                        Cancelar
                      </>
                    )}
                  </Button>
                )}
            </div>
            <Separator />
          </>
        )}

        <ScrollArea className="flex-1">
          {/* Background jobs indicator (non-blocking) */}
          {backgroundJobs.length > 0 && (
            <div className="px-3 pt-3 pb-2 space-y-1.5">
              <p className="truncate text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-1">
                Procesando en segundo plano
              </p>
              {backgroundJobs.map((job) => (
                <div
                  key={job.id}
                  className="flex items-center gap-2 overflow-hidden rounded-md border bg-muted/40 px-2.5 py-1.5 text-xs"
                >
                  {job.status === "downloading" ? (
                    <Download className="h-3.5 w-3.5 shrink-0 text-primary animate-bounce" />
                  ) : (
                    <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-primary" />
                  )}
                  <span className="min-w-0 flex-1 truncate font-medium text-foreground">
                    {job.label}
                  </span>
                  <span className="shrink-0 truncate text-muted-foreground max-w-[7rem]">
                    {job.status === "downloading"
                      ? "Descargando…"
                      : job.status === "cancelling"
                        ? "Cancelando…"
                        : job.status === "failed"
                          ? "Falló"
                          : "Procesando…"}
                  </span>
                  {(job.status === "processing" ||
                    job.status === "cancelling") && (
                    <button
                      type="button"
                      onClick={() => handleCancelBackgroundJob(job)}
                      disabled={job.status === "cancelling"}
                      className="shrink-0 rounded p-0.5 text-muted-foreground hover:text-destructive transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                      aria-label={`Cancelar ${job.label}`}
                    >
                      {job.status === "cancelling" ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <X className="h-3.5 w-3.5" />
                      )}
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
          <div className="flex flex-col gap-1 p-2">
            {actions.map((action) => (
              <button
                key={action.id}
                onClick={() => handleActionClick(action.id)}
                disabled={isConverting || action.comingSoon}
                className={cn(
                  "flex w-full items-center gap-3 overflow-hidden rounded-lg px-3 py-2.5 text-left text-sm transition-colors",
                  selectedAction === action.id
                    ? "bg-primary text-primary-foreground"
                    : "text-foreground hover:bg-accent hover:text-accent-foreground",
                  (isConverting || action.comingSoon) && "opacity-50 cursor-not-allowed",
                )}
              >
                <action.icon className="h-4 w-4 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="truncate font-medium">{action.label}</span>
                    {action.comingSoon && (
                      <span className="rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary leading-none">
                        Próximamente
                      </span>
                    )}
                  </div>
                  <div
                    className={cn(
                      "text-xs truncate",
                      selectedAction === action.id
                        ? "text-primary-foreground/80"
                        : "text-muted-foreground",
                    )}
                  >
                    {action.description}
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 shrink-0 opacity-50" />
              </button>
            ))}
          </div>
        </ScrollArea>

        <Separator />

        <div className="p-4">
          {hasPriorityLocalDownload && (
            <p className="mb-2 rounded-md border border-primary/30 bg-primary/10 px-3 py-2 text-xs text-primary">
              Imagen lista: {localDownloadFileName ?? "archivo recortado"}
            </p>
          )}
          <Button
            variant={
              hasPriorityLocalDownload || isDownloadReady
                ? "default"
                : "outline"
            }
            className="w-full gap-2 h-12 hover:scale-[1.02] transition-transform"
            disabled={isDownloadDisabled}
            onClick={handlePrimaryDownload}
          >
            {isDownloading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Descargando...
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                {downloadButtonLabel}
              </>
            )}
          </Button>
        </div>
      </aside>

      {/* Convert Dialog */}
      <Dialog open={showConvertDialog} onOpenChange={setShowConvertDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Convert to</DialogTitle>
            <DialogDescription>
              Select the target format for your file.
            </DialogDescription>
          </DialogHeader>

          <RadioGroup
            value={selectedFormat}
            onValueChange={setSelectedFormat}
            className="mt-4 grid grid-cols-2 gap-2"
          >
            {conversionOptions.map((option: ConversionOption) => (
              <div key={option.id} className="flex items-center gap-2">
                <RadioGroupItem value={option.extension} id={option.id} />
                <Label
                  htmlFor={option.id}
                  className="flex flex-1 cursor-pointer items-center justify-between rounded-md border px-3 py-2 text-sm hover:bg-accent"
                >
                  <span className="font-medium">{option.label}</span>
                  <span className="text-xs text-muted-foreground">
                    .{option.extension}
                  </span>
                </Label>
              </div>
            ))}
          </RadioGroup>

          {category === "audio" && (
            <div className="mt-4">
              <AudioOptions value={audioParams} onChange={setAudioParams} />
            </div>
          )}

          {category === "video" && (
            <div className="mt-4">
              <VideoOptions value={videoParams} onChange={setVideoParams} />
            </div>
          )}

          <div className="mt-6 flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setShowConvertDialog(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleConvert}>Convert</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={showMergeOrderDialog}
        onOpenChange={(open) => {
          if (isPreparingMerge) return;
          setShowMergeOrderDialog(open);
          if (!open) {
            setDraggingMergeFileId(null);
            clearMergeSourceFiles();
          }
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Order PDFs before merging</DialogTitle>
            <DialogDescription>
              Drag files to define merge order. The PDF in position 1 will be
              used as the base document.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 space-y-2 max-h-72 overflow-auto pr-1">
            {mergeSourceFiles.map((source, index) => (
              <div
                key={source.id}
                draggable={!isPreparingMerge}
                onDragStart={() => setDraggingMergeFileId(source.id)}
                onDragOver={(event) => {
                  event.preventDefault();
                }}
                onDrop={() => {
                  if (!draggingMergeFileId) return;
                  reorderMergeFiles(draggingMergeFileId, source.id);
                }}
                onDragEnd={() => setDraggingMergeFileId(null)}
                className={cn(
                  "flex items-center gap-3 rounded-md border px-3 py-2",
                  draggingMergeFileId === source.id
                    ? "border-primary bg-primary/5"
                    : "bg-card",
                )}
              >
                <GripVertical className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground w-6 shrink-0">
                  {index + 1}.
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">
                    {source.file.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {(source.file.size / (1024 * 1024)).toFixed(2)} MB
                    {source.isCurrent ? " • Current file" : ""}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 flex justify-end gap-2">
            <Button
              variant="outline"
              disabled={isPreparingMerge}
              onClick={() => {
                setShowMergeOrderDialog(false);
                setDraggingMergeFileId(null);
                clearMergeSourceFiles();
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmMergeOrder}
              disabled={isPreparingMerge || mergeSourceFiles.length === 0}
            >
              {isPreparingMerge ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                "Merge in this order"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={showImagesToPdfDialog}
        onOpenChange={(open) => {
          if (isPreparingImagesToPdf) return;
          setShowImagesToPdfDialog(open);
          if (!open) {
            setDraggingImagesToPdfId(null);
            setImagesToPdfFiles([]);
          }
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Armar PDF</DialogTitle>
            <DialogDescription>
              Cada imagen será una página. Arrastrá para ordenarlas.
            </DialogDescription>
          </DialogHeader>

          <Button
            variant="outline"
            size="sm"
            className="mt-2 w-fit"
            disabled={isPreparingImagesToPdf}
            onClick={addMoreImages}
          >
            + Agregar imágenes
          </Button>

          <div className="mt-2 space-y-2 max-h-72 overflow-auto pr-1">
            {imagesToPdfFiles.map((source, index) => (
              <div
                key={source.id}
                draggable={!isPreparingImagesToPdf}
                onDragStart={() => setDraggingImagesToPdfId(source.id)}
                onDragOver={(event) => {
                  event.preventDefault();
                }}
                onDrop={() => {
                  if (!draggingImagesToPdfId) return;
                  reorderImagesToPdf(draggingImagesToPdfId, source.id);
                }}
                onDragEnd={() => setDraggingImagesToPdfId(null)}
                className={cn(
                  "flex items-center gap-3 rounded-md border px-3 py-2",
                  draggingImagesToPdfId === source.id
                    ? "border-primary bg-primary/5"
                    : "bg-card",
                )}
              >
                <GripVertical className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground w-6 shrink-0">
                  {index + 1}.
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">
                    {source.file.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {(source.file.size / (1024 * 1024)).toFixed(2)} MB
                    {source.isCurrent ? " • Archivo actual" : ""}
                  </p>
                </div>
                {!source.isCurrent && (
                  <button
                    type="button"
                    aria-label={`Remove ${source.file.name}`}
                    disabled={isPreparingImagesToPdf}
                    onClick={() => removeImage(source.id)}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="mt-6 flex justify-end gap-2">
            <Button
              variant="outline"
              disabled={isPreparingImagesToPdf}
              onClick={() => {
                setShowImagesToPdfDialog(false);
                setDraggingImagesToPdfId(null);
                setImagesToPdfFiles([]);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmImagesToPdf}
              disabled={isPreparingImagesToPdf || imagesToPdfFiles.length === 0}
            >
              {isPreparingImagesToPdf ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generando...
                </>
              ) : (
                "Generar PDF"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {currentFile && (
        <ImageCropDialog
          open={showCropDialog}
          onOpenChange={setShowCropDialog}
          file={currentFile}
          onApply={handleCropApply}
        />
      )}

      {/* Compress Dialog */}
      <Dialog open={showCompressDialog} onOpenChange={setShowCompressDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Comprimir Imagen</DialogTitle>
            <DialogDescription>
              Reduce el tamaño del archivo manteniendo la calidad óptima.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            {/* Compression Level */}
            <div className="space-y-2">
              <Label>Nivel de compresión</Label>
              <RadioGroup
                value={compressLevel}
                onValueChange={(value) =>
                  setCompressLevel(value as "low" | "balanced" | "strong")
                }
                className="grid gap-2"
              >
                <div className="flex items-center space-x-3">
                  <RadioGroupItem value="low" id="low" />
                  <Label
                    htmlFor="low"
                    className="flex flex-1 cursor-pointer items-center justify-between rounded-md border p-3 hover:bg-accent"
                  >
                    <div>
                      <div className="font-medium">Baja</div>
                      <div className="text-xs text-muted-foreground">
                        10-20% de reducción • Máxima calidad
                      </div>
                    </div>
                  </Label>
                </div>
                <div className="flex items-center space-x-3">
                  <RadioGroupItem value="balanced" id="balanced" />
                  <Label
                    htmlFor="balanced"
                    className="flex flex-1 cursor-pointer items-center justify-between rounded-md border p-3 hover:bg-accent"
                  >
                    <div>
                      <div className="font-medium">Balanceada </div>
                      <div className="text-xs text-muted-foreground">
                        30-60% de reducción • Recomendada
                      </div>
                    </div>
                  </Label>
                </div>
                <div className="flex items-center space-x-3">
                  <RadioGroupItem value="strong" id="strong" />
                  <Label
                    htmlFor="strong"
                    className="flex flex-1 cursor-pointer items-center justify-between rounded-md border p-3 hover:bg-accent"
                  >
                    <div>
                      <div className="font-medium">Fuerte</div>
                      <div className="text-xs text-muted-foreground">
                        60-90% de reducción • Máxima compresión
                      </div>
                    </div>
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Output Format */}
            <div className="space-y-2">
              <Label>Formato de salida</Label>
              <RadioGroup
                value={compressFormat}
                onValueChange={setCompressFormat}
                className="grid gap-2"
              >
                {["jpg", "png", "webp"].map((format) => (
                  <div key={format} className="flex items-center space-x-3">
                    <RadioGroupItem value={format} id={`compress-${format}`} />
                    <Label
                      htmlFor={`compress-${format}`}
                      className="flex flex-1 cursor-pointer items-center justify-between rounded-md border p-3 hover:bg-accent"
                    >
                      <div className="font-medium">{format.toUpperCase()}</div>
                      <span className="text-xs text-muted-foreground">
                        .{format}
                      </span>
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setShowCompressDialog(false)}
            >
              Cancelar
            </Button>
            <Button onClick={handleCompress}>Comprimir</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Watermark Dialog */}
      <Dialog open={showWatermarkDialog} onOpenChange={setShowWatermarkDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Agregar Marca de Agua</DialogTitle>
            <DialogDescription>
              Protege tu imagen con una marca de agua personalizada.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            {/* Watermark Type */}
            <div className="space-y-2">
              <Label>Tipo de marca de agua</Label>
              <RadioGroup
                value={watermarkType}
                onValueChange={(value) =>
                  setWatermarkType(value as "text" | "logo")
                }
                className="grid grid-cols-2 gap-2"
              >
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="text" id="wm-text" />
                  <Label
                    htmlFor="wm-text"
                    className="flex flex-1 cursor-pointer rounded-md border px-3 py-2 text-sm hover:bg-accent"
                  >
                    Texto
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="logo" id="wm-logo" disabled />
                  <Label
                    htmlFor="wm-logo"
                    className="flex flex-1 cursor-not-allowed rounded-md border px-3 py-2 text-sm opacity-50"
                  >
                    Logo (Próximamente)
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Text Input (only for text watermark) */}
            {watermarkType === "text" && (
              <div className="space-y-2">
                <Label htmlFor="wm-text-input">Texto</Label>
                <Input
                  id="wm-text-input"
                  type="text"
                  value={watermarkText}
                  onChange={(e) => setWatermarkText(e.target.value)}
                  placeholder="© 2026 MyBrand"
                />
              </div>
            )}

            {/* Position */}
            <div className="space-y-2">
              <Label>Posición</Label>
              <RadioGroup
                value={watermarkPosition}
                onValueChange={(value) => setWatermarkPosition(value as any)}
                className="grid grid-cols-2 gap-2"
              >
                {[
                  { value: "top-left", label: "Superior Izq." },
                  { value: "top-right", label: "Superior Der." },
                  { value: "center", label: "Centro" },
                  { value: "bottom-left", label: "Inferior Izq." },
                  { value: "bottom-right", label: "Inferior Der." },
                  { value: "diagonal", label: "Diagonal" },
                ].map((pos) => (
                  <div key={pos.value} className="flex items-center space-x-2">
                    <RadioGroupItem value={pos.value} id={`pos-${pos.value}`} />
                    <Label
                      htmlFor={`pos-${pos.value}`}
                      className="flex flex-1 cursor-pointer rounded-md border p-2 text-xs hover:bg-accent"
                    >
                      {pos.label}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            {/* Opacity Slider */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label>Opacidad</Label>
                <span className="text-xs text-muted-foreground">
                  {Math.round(watermarkOpacity * 100)}%
                </span>
              </div>
              <Slider
                value={[watermarkOpacity]}
                onValueChange={(values) => setWatermarkOpacity(values[0])}
                min={0}
                max={1}
                step={0.1}
                className="w-full"
              />
            </div>

            {/* Font Size (text only) */}
            {watermarkType === "text" && (
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label>Tamaño de fuente</Label>
                  <span className="text-xs text-muted-foreground">
                    {watermarkFontSize}px
                  </span>
                </div>
                <Slider
                  value={[watermarkFontSize]}
                  onValueChange={(values) => setWatermarkFontSize(values[0])}
                  min={20}
                  max={100}
                  step={5}
                  className="w-full"
                />
              </div>
            )}

            {/* Color (text only) */}
            {watermarkType === "text" && (
              <div className="space-y-2">
                <Label>Color</Label>
                <RadioGroup
                  value={watermarkColor}
                  onValueChange={setWatermarkColor}
                  className="grid grid-cols-3 gap-2"
                >
                  {[
                    { value: "white", label: "Blanco" },
                    { value: "black", label: "Negro" },
                    { value: "red", label: "Rojo" },
                  ].map((color) => (
                    <div
                      key={color.value}
                      className="flex items-center space-x-2"
                    >
                      <RadioGroupItem
                        value={color.value}
                        id={`color-${color.value}`}
                      />
                      <Label
                        htmlFor={`color-${color.value}`}
                        className="flex flex-1 cursor-pointer rounded-md border p-2 text-xs hover:bg-accent"
                      >
                        {color.label}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            )}

            {/* Output Format */}
            <div className="space-y-2">
              <Label>Formato de salida</Label>
              <RadioGroup
                value={watermarkFormat}
                onValueChange={setWatermarkFormat}
                className="grid grid-cols-3 gap-2"
              >
                {["jpg", "png", "webp"].map((format) => (
                  <div key={format} className="flex items-center gap-2">
                    <RadioGroupItem value={format} id={`wm-format-${format}`} />
                    <Label
                      htmlFor={`wm-format-${format}`}
                      className="flex flex-1 cursor-pointer items-center justify-center rounded-md border px-3 py-2 text-sm hover:bg-accent"
                    >
                      .{format}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setShowWatermarkDialog(false)}
            >
              Cancelar
            </Button>
            <Button onClick={handleWatermark}>Agregar Marca de Agua</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
