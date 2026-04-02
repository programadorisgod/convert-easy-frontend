"use client";

import { useCallback, useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Upload,
  FileText,
  Image,
  Film,
  Music,
  File,
  AlertCircle,
  X,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { formatFileSize } from "@/lib/file-utils";
import { storeFile, createFilePreviewUrl } from "@/lib/file-store";
import type { ConversionConfig } from "@/lib/conversion-config";
import type { FileCategory, StoredFileInfo } from "@/types/file";
import { createStoredFileInfo } from "@/lib/file-utils";

interface FilePreview {
  name: string;
  size: number;
  extension: string;
  category: FileCategory;
  file: File;
  previewUrl: string;
}

const CATEGORY_ICONS: Record<FileCategory, React.ComponentType<{ className?: string }>> = {
  document: FileText,
  image: Image,
  video: Film,
  audio: Music,
  unknown: File,
};

interface ConversionPageProps {
  config: ConversionConfig;
}

export function ConversionPage({ config }: ConversionPageProps) {
  const router = useRouter();
  const [file, setFile] = useState<FilePreview | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [invalidFile, setInvalidFile] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const acceptedExtensions = config.sourceExtensions.join(",");

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

  const generateFileId = (): string => {
    return `file_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  };

  const isValidFile = useCallback(
    (file: File): boolean => {
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
            `Invalid file: ${ext}. Accepted: ${config.sourceExtensions.join(", ")}`
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
          `Invalid file: ${ext}. Accepted: ${config.sourceExtensions.join(", ")}`
        );
      }
    }
    e.target.value = "";
  };

  const handleContinueToEditor = () => {
    if (!file) return;

    const fileId = generateFileId();

    storeFile(fileId, file.file);

    const storedFileInfo: StoredFileInfo = {
      id: fileId,
      name: file.name,
      size: file.size,
      type: file.file.type,
      extension: file.extension,
      category: file.category,
    };

    sessionStorage.setItem("pendingFile", JSON.stringify(storedFileInfo));

    sessionStorage.setItem(
      "conversionContext",
      JSON.stringify({
        slug: config.slug,
        targetFormat: config.targetFormat,
      })
    );

    router.push(`/editor?file=${fileId}`);
  };

  useEffect(() => {
    if (file) {
      handleContinueToEditor();
    }
  }, [file]);

  const handleReset = () => {
    if (file?.previewUrl) {
      URL.revokeObjectURL(file.previewUrl);
    }
    setFile(null);
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

        {!file ? (
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
                  : `Upload your ${config.sourceExtensions[0].replace(".", "").toUpperCase()} file`}
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Drag and drop or click to browse
              </p>
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
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-xl border bg-card p-12">
            <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
              <CategoryIcon className="h-10 w-10 text-primary" />
            </div>
            <h3 className="mb-2 text-xl font-semibold">{file.name}</h3>
            <p className="mb-6 text-sm text-muted-foreground">
              {file.extension.toUpperCase()} - {formatFileSize(file.size)}
            </p>
            <div className="flex items-center gap-2 text-primary">
              <div className="h-2 w-2 animate-bounce rounded-full bg-primary [animation-delay:-0.3s]" />
              <div className="h-2 w-2 animate-bounce rounded-full bg-primary [animation-delay:-0.15s]" />
              <div className="h-2 w-2 animate-bounce rounded-full bg-primary" />
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              Redirecting to editor...
            </p>
          </div>
        )}

        <div className="mt-8 rounded-lg border bg-muted/50 p-4">
          <h3 className="mb-2 font-medium">Quick tips:</h3>
          <ul className="space-y-1 text-sm text-muted-foreground">
            <li>Input formats: {config.sourceExtensions.join(", ")}</li>
            <li>Output format: {config.targetFormat.toUpperCase()}</li>
            <li>Files are processed securely and deleted after download</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
