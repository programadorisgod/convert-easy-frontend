"use client";

import { useCallback, useState, useRef, useEffect } from "react";
import {
  Upload,
  FileText,
  Image,
  Film,
  Music,
  File,
  AlertCircle,
  X,
  Loader2,
  Sparkles,
  Download,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { formatFileSize } from "@/lib/file-utils";
import { createFilePreviewUrl } from "@/lib/file-store";
import type { ToolConfig } from "@/lib/conversion-config";
import type { FileCategory } from "@/types/file";
import { executeAction, type ActionResult, cancelAction } from "../convert/action-executor";
import { sileo } from "sileo";
import { Button } from "@/components/ui/button";
import { PdfSignPage } from "@/components/pdf-sign/pdf-sign-page";

interface FilePreview {
  name: string;
  size: number;
  extension: string;
  category: FileCategory;
  file: File;
  previewUrl: string;
}

type WorkflowStatus =
  | "idle"
  | "file-selected"
  | "processing"
  | "completed"
  | "failed";

const CATEGORY_ICONS: Record<FileCategory, React.ComponentType<{ className?: string }>> = {
  document: FileText,
  image: Image,
  video: Film,
  audio: Music,
  unknown: File,
};

interface ToolPageProps {
  config: ToolConfig;
}

export function ToolPage({ config }: ToolPageProps) {
  const [file, setFile] = useState<FilePreview | null>(null);
  const [status, setStatus] = useState<WorkflowStatus>("idle");
  const [stage, setStage] = useState<string>("uploading");
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<ActionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [invalidFile, setInvalidFile] = useState<string | null>(null);
  const [currentJobId, setCurrentJobId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const acceptedExtensions = config.sourceExtensions?.join(",") || "*";

  const getCategoryFromExtension = (ext: string): FileCategory => {
    const extension = ext.toLowerCase().replace(".", "");
    const docExtensions = ["doc", "docx", "odt", "md", "txt", "pdf"];
    const imageExtensions = ["jpg", "jpeg", "png", "gif", "webp", "svg"];
    const videoExtensions = ["mp4", "avi", "mov", "mkv", "webm"];
    const audioExtensions = ["mp3", "wav", "flac", "aac", "ogg", "m4a"];

    if (docExtensions.includes(extension)) return "document";
    if (imageExtensions.includes(extension)) return "image";
    if (videoExtensions.includes(extension)) return "video";
    if (audioExtensions.includes(extension)) return "audio";
    return "unknown";
  };

  const isValidFile = useCallback(
    (file: File): boolean => {
      if (!config.sourceExtensions || config.sourceExtensions.length === 0) {
        return true;
      }
      const extension = "." + file.name.split(".").pop()?.toLowerCase();
      return config.sourceExtensions.includes(extension);
    },
    [config.sourceExtensions]
  );

  const handleFileSelect = useCallback(
    (selectedFile: File) => {
      const extension = selectedFile.name.split(".").pop()?.toLowerCase() || "";
      const category = getCategoryFromExtension(extension);
      const previewUrl = createFilePreviewUrl(selectedFile);

      setFile({
        name: selectedFile.name,
        size: selectedFile.size,
        extension,
        category,
        file: selectedFile,
        previewUrl,
      });
      setInvalidFile(null);
      setStatus("file-selected");
    },
    []
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);
      setInvalidFile(null);

      const files = e.dataTransfer?.files;
      if (files && files.length > 0) {
        const droppedFile = files[0];
        if (isValidFile(droppedFile)) {
          handleFileSelect(droppedFile);
        } else {
          const ext = "." + droppedFile.name.split(".").pop()?.toLowerCase();
          setInvalidFile(
            `Invalid file: ${ext}. Accepted: ${config.sourceExtensions?.join(", ") || "any"}`
          );
        }
      }
    },
    [isValidFile, handleFileSelect, config.sourceExtensions]
  );

  const handleClick = () => {
    inputRef.current?.click();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const selectedFile = files[0];
      if (isValidFile(selectedFile)) {
        handleFileSelect(selectedFile);
      } else {
        const ext = "." + selectedFile.name.split(".").pop()?.toLowerCase();
        setInvalidFile(
          `Invalid file: ${ext}. Accepted: ${config.sourceExtensions?.join(", ") || "any"}`
        );
      }
    }
    e.target.value = "";
  };

  const handleExecute = async () => {
    if (!file) return;

    setStatus("processing");
    setStage("uploading");
    setProgress(0);
    setError(null);

    try {
      const actionResult = await executeAction({
        file: file.file,
        config,
        onProgress: (newStage, newProgress) => {
          setStage(newStage);
          setProgress(newProgress);
        },
      });

      setResult(actionResult);
      setStatus("completed");

      triggerDownload(actionResult);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Error desconocido";
      setError(errorMessage);
      setStatus("failed");

      sileo.error({
        title: "Error",
        description: errorMessage,
        icon: <AlertCircle className="size-3.5" />,
        roundness: 16,
        duration: 6000,
      });
    }
  };

  const triggerDownload = (actionResult: ActionResult) => {
    const url = URL.createObjectURL(actionResult.blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = actionResult.filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const handleDownload = () => {
    if (result) {
      triggerDownload(result);
    }
  };

  const handleReset = () => {
    if (file?.previewUrl) {
      URL.revokeObjectURL(file.previewUrl);
    }
    setFile(null);
    setStatus("idle");
    setResult(null);
    setError(null);
    setProgress(0);
    setCurrentJobId(null);
  };

  useEffect(() => {
    return () => {
      if (file?.previewUrl) {
        URL.revokeObjectURL(file.previewUrl);
      }
    };
  }, [file]);

  const Icon = config.icon;
  const CategoryIcon = file ? CATEGORY_ICONS[file.category] : Icon;

  const getActionLabel = () => {
    const actionLabels: Record<string, string> = {
      compress: "Comprimir",
      organize: "Organizar",
      protect: "Proteger",
      extract: "Extraer audio",
      trim: "Recortar",
      normalize: "Normalizar",
      sign: "Firmar",
    };
    return actionLabels[config.type] || "Procesar";
  };

  const renderStateContent = () => {
    switch (status) {
      case "idle":
        return renderFileSelector();

      case "file-selected":
        return renderFileSelected();

      case "processing":
        return renderProcessing();

      case "completed":
        return renderCompleted();

      case "failed":
        return renderFailed();

      default:
        return null;
    }
  };

  const renderFileSelector = () => (
    <div
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          handleClick();
        }
      }}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={cn(
        "relative flex min-h-80 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 transition-all duration-200",
        isDragOver
          ? "border-primary bg-primary/5 scale-[1.02]"
          : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50"
      )}
    >
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-muted text-muted-foreground transition-all duration-200">
        <Upload className="h-10 w-10" />
      </div>

      <div className="text-center">
        <h3 className="text-xl font-semibold text-foreground">
          {isDragOver
            ? "Drop your file here"
            : `Upload your ${config.sourceExtensions?.[0]?.replace(".", "").toUpperCase() || "file"}`}
        </h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Drag and drop or click to browse
        </p>
        {config.sourceExtensions && config.sourceExtensions.length > 0 && (
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
            {config.sourceExtensions.map((ext) => (
              <span
                key={ext}
                className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground"
              >
                {ext.toUpperCase()}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderFileSelected = () => (
    <div className="flex flex-col items-center justify-center rounded-xl border bg-card p-12">
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
        <CategoryIcon className="h-10 w-10 text-primary" />
      </div>
      <h3 className="mb-2 text-xl font-semibold">{file?.name}</h3>
      <p className="mb-8 text-sm text-muted-foreground">
        {file?.extension.toUpperCase()} - {formatFileSize(file?.size || 0)}
      </p>

      <div className="flex gap-3">
        <Button
          variant="outline"
          onClick={handleReset}
          className="gap-2"
        >
          <X className="h-4 w-4" />
          Cambiar archivo
        </Button>
        <Button
          onClick={handleExecute}
          className="gap-2"
        >
          <Sparkles className="h-4 w-4" />
          {getActionLabel()}
        </Button>
      </div>
    </div>
  );

  const renderProcessing = () => (
    <div className="flex flex-col items-center justify-center rounded-xl border bg-card p-12">
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
      <h3 className="mb-2 text-xl font-semibold">Procesando tu archivo</h3>
      <p className="mb-2 text-sm text-muted-foreground">
        {stage === "uploading" ? "Subiendo archivo..." : "Procesando..."}
      </p>

      <div className="mb-6 w-full max-w-xs">
        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="mt-2 text-center text-xs text-muted-foreground">
          {progress}%
        </p>
      </div>

      <Button
        variant="outline"
        onClick={() => {
          if (currentJobId) {
            cancelAction(currentJobId);
          }
          handleReset();
        }}
        className="gap-2"
      >
        <X className="h-4 w-4" />
        Cancelar
      </Button>
    </div>
  );

  const renderCompleted = () => (
    <div className="flex flex-col items-center justify-center rounded-xl border bg-card p-12">
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-500/10">
        <Sparkles className="h-10 w-10 text-green-500" />
      </div>
      <h3 className="mb-2 text-xl font-semibold">¡Listo!</h3>
      <p className="mb-2 text-sm text-muted-foreground">
        Tu archivo ha sido procesado exitosamente
      </p>
      <p className="mb-8 text-xs text-muted-foreground">
        {result?.filename}
      </p>

      <div className="flex gap-3">
        <Button
          variant="outline"
          onClick={handleReset}
          className="gap-2"
        >
          <Upload className="h-4 w-4" />
          Procesar otro archivo
        </Button>
        <Button
          onClick={handleDownload}
          className="gap-2"
        >
          <Download className="h-4 w-4" />
          Descargar archivo
        </Button>
      </div>
    </div>
  );

  const renderFailed = () => (
    <div className="flex flex-col items-center justify-center rounded-xl border bg-card p-12">
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10">
        <AlertCircle className="h-10 w-10 text-destructive" />
      </div>
      <h3 className="mb-2 text-xl font-semibold">Error en el procesamiento</h3>
      <p className="mb-2 text-muted-foreground">{error}</p>

      <div className="flex gap-3">
        <Button
          variant="outline"
          onClick={handleReset}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Intentar de nuevo
        </Button>
        <Button
          onClick={handleExecute}
          className="gap-2"
        >
          <Sparkles className="h-4 w-4" />
          Reintentar
        </Button>
      </div>
    </div>
  );

  const renderContent = () => {
    // Special handling for sign type - show header + full width PDF signing page
    if (config.type === "sign") {
      return (
        <div className="container mx-auto px-4 pt-4">
          <div className="mb-6">
            <div className="mb-3 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <Icon className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">{config.label}</h1>
                <p className="text-sm text-muted-foreground">
                  {config.description}
                </p>
              </div>
            </div>
          </div>
          <PdfSignPage initialFile={file?.file || null} />
        </div>
      );
    }

    // Normal centered container
    return (
      <div className="container mx-auto max-w-4xl px-4 py-8">
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          ← Back to home
        </Link>

        <div className="mb-8">
          <h1 className="mb-2 text-3xl font-bold">{config.title}</h1>
          <p className="text-muted-foreground">{config.description}</p>
        </div>

        {renderStateContent()}
      </div>
    );
  };

  // For sign type, use container with full width
  if (config.type === "sign") {
    return (
      <div className="min-h-screen bg-background">
        {renderContent()}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto max-w-4xl px-4 py-8">
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          ← Back to home
        </Link>

        <div className="mb-8">
          <div className="mb-3 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
              <Icon className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">{config.label}</h1>
              <p className="text-sm text-muted-foreground">
                {config.description}
              </p>
            </div>
          </div>
        </div>

        <input
          ref={inputRef}
          type="file"
          onChange={handleInputChange}
          className="sr-only"
          accept={acceptedExtensions}
        />

        {invalidFile && (
          <div className="mb-4 flex items-center gap-2 rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{invalidFile}</span>
            <button
              onClick={() => setInvalidFile(null)}
              className="ml-auto rounded-full p-1 hover:bg-destructive/20"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        )}

        {renderContent()}

        <div className="mt-8 rounded-lg border bg-muted/50 p-4">
          <h3 className="mb-2 font-medium">Quick tips:</h3>
          <ul className="space-y-1 text-sm text-muted-foreground">
            {config.sourceExtensions && (
              <li>Input formats: {config.sourceExtensions.join(", ")}</li>
            )}
            {config.outputFormat && (
              <li>Output format: {config.outputFormat.toUpperCase()}</li>
            )}
            <li>Files are processed securely and deleted after download</li>
          </ul>
        </div>
      </div>
    </div>
  );
}