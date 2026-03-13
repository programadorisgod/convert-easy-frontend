"use client";

import { useRouter } from "next/navigation";
import { Upload, FileText, Image, Film, Music, File } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  createFileInfo,
  createStoredFileInfo,
  formatFileSize,
  getCategoryLabel,
} from "@/lib/file-utils";
import { storeFile } from "@/lib/file-store";
import type { FileInfo, FileCategory } from "@/types/file";
import {
  ChangeEvent,
  DragEvent,
  ElementType,
  useCallback,
  useRef,
  useState,
} from "react";

const CATEGORY_ICONS: Record<FileCategory, ElementType> = {
  document: FileText,
  image: Image,
  video: Film,
  audio: Music,
  unknown: File,
};

interface FileDropzoneProps {
  onFileSelect?: (file: FileInfo) => void;
  className?: string;
}

export function FileDropzone({ onFileSelect, className }: FileDropzoneProps) {
  const router = useRouter();
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<FileInfo | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const processFile = useCallback(
    (file: File) => {
      const fileInfo = createFileInfo(file);
      setSelectedFile(fileInfo);

      // Store the actual file for preview purposes
      storeFile(fileInfo.id, file);

      if (onFileSelect) {
        onFileSelect(fileInfo);
      }

      // Store file info in sessionStorage for the editor
      sessionStorage.setItem(
        "pendingFile",
        JSON.stringify(createStoredFileInfo(file, fileInfo.id)),
      );

      // Navigate to editor
      router.push(`/editor?file=${fileInfo.id}`);
    },
    [onFileSelect, router],
  );

  const handleDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);

      const files = e.dataTransfer?.files;
      if (files && files.length > 0) {
        processFile(files[0]);
      }
    },
    [processFile],
  );

  const handleClick = () => {
    inputRef.current?.click();
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  };

  const IconComponent = selectedFile
    ? CATEGORY_ICONS[selectedFile.category]
    : Upload;

  return (
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
        "relative flex min-h-100 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 transition-all duration-200",
        isDragOver
          ? "border-primary bg-primary/5 scale-[1.02]"
          : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50",
        selectedFile && "border-primary bg-primary/5",
        className,
      )}
    >
      <input
        ref={inputRef}
        type="file"
        onChange={handleInputChange}
        className="sr-only"
        accept="*/*"
      />

      <div
        className={cn(
          "mb-6 flex h-20 w-20 items-center justify-center rounded-full transition-all duration-200",
          isDragOver || selectedFile
            ? "bg-primary/10 text-primary"
            : "bg-muted text-muted-foreground",
        )}
      >
        <IconComponent className="h-10 w-10" />
      </div>

      {selectedFile ? (
        <div className="text-center">
          <h3 className="text-lg font-semibold text-foreground">
            {selectedFile.name}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {getCategoryLabel(selectedFile.category)} -{" "}
            {formatFileSize(selectedFile.size)}
          </p>
          <p className="mt-3 text-sm text-primary">Redirecting to editor...</p>
        </div>
      ) : (
        <div className="text-center">
          <h3 className="text-xl font-semibold text-foreground">
            {isDragOver
              ? "Drop your file here"
              : "Drag your file and choose what to do"}
          </h3>
          <p className="mt-2 text-sm text-muted-foreground">
            or click to browse your files
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <FileText className="h-4 w-4" />
              <span>Documents</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Image className="h-4 w-4" />
              <span>Images</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Film className="h-4 w-4" />
              <span>Videos</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Music className="h-4 w-4" />
              <span>Audio</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
