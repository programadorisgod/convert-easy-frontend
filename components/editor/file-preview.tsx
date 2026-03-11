"use client"

import { FileText, Image, Film, Music, File, Loader2 } from "lucide-react"

import { cn } from "@/lib/utils"
import { formatFileSize, isLargeFile } from "@/lib/file-utils"
import type { FileCategory } from "@/types/file"
import { ElementType } from "react"

const CATEGORY_ICONS: Record<FileCategory, ElementType> = {
  document: FileText,
  image: Image,
  video: Film,
  audio: Music,
  unknown: File,
}

interface FilePreviewProps {
  name: string
  size: number
  category: FileCategory
  extension: string
  previewUrl?: string
  isProcessing?: boolean
  className?: string
}

export function FilePreview({
  name,
  size,
  category,
  extension,
  previewUrl,
  isProcessing = false,
  className,
}: FilePreviewProps) {
  const IconComponent = CATEGORY_ICONS[category]

  return (
    <div
      className={cn(
        "flex flex-1 flex-col items-center justify-center rounded-lg border bg-card p-8",
        className
      )}
    >
      {/* Preview content */}
      {category === "image" && previewUrl ? (
        <div className="relative max-h-[400px] max-w-full overflow-hidden rounded-lg">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={previewUrl}
            alt={name}
            className="h-auto max-h-[400px] w-auto object-contain"
          />
        </div>
      ) : category === "video" && previewUrl ? (
        <div className="relative w-full max-w-2xl overflow-hidden rounded-lg">
          <video
            src={previewUrl}
            controls
            className="h-auto w-full object-contain"
          >
            Your browser does not support the video tag.
          </video>
        </div>
      ) : category === "audio" && previewUrl ? (
        <div className="flex w-full max-w-md flex-col items-center gap-6">
          <div className="flex h-32 w-32 items-center justify-center rounded-2xl bg-muted">
            <IconComponent className="h-16 w-16 text-muted-foreground" />
          </div>
          <audio
            src={previewUrl}
            controls
            className="w-full"
          >
            Your browser does not support the audio tag.
          </audio>
        </div>
      ) : (
        <div className="flex h-32 w-32 items-center justify-center rounded-2xl bg-muted">
          {isProcessing ? (
            <Loader2 className="h-16 w-16 animate-spin text-primary" />
          ) : (
            <IconComponent className="h-16 w-16 text-muted-foreground" />
          )}
        </div>
      )}

      {/* File info */}
      <div className="mt-6 text-center">
        <h2 className="text-lg font-semibold text-foreground line-clamp-2">
          {name}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {extension.toUpperCase()} - {formatFileSize(size)}
        </p>
      </div>

   

      {/* Processing indicator */}
      {isProcessing && (
        <div className="mt-6 text-center">
          <p className="text-sm text-muted-foreground">
            Processing your file...
          </p>
        </div>
      )}
    </div>
  )
}
