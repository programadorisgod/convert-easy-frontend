import type { FileCategory, FileInfo, StoredFileInfo } from "@/types/file"

const EXTENSION_MAP: Record<string, FileCategory> = {
  // Documents
  pdf: "document",
  doc: "document",
  docx: "document",
  odt: "document",
  rtf: "document",
  txt: "document",
  md: "document",
  html: "document",
  htm: "document",
  xls: "document",
  xlsx: "document",
  ppt: "document",
  pptx: "document",
  
  // Images
  jpg: "image",
  jpeg: "image",
  png: "image",
  gif: "image",
  webp: "image",
  svg: "image",
  bmp: "image",
  ico: "image",
  tiff: "image",
  tif: "image",
  heic: "image",
  heif: "image",
  avif: "image",
  
  // Videos
  mp4: "video",
  mkv: "video",
  avi: "video",
  mov: "video",
  wmv: "video",
  flv: "video",
  webm: "video",
  m4v: "video",
  mpeg: "video",
  mpg: "video",
  
  // Audio
  mp3: "audio",
  wav: "audio",
  flac: "audio",
  aac: "audio",
  ogg: "audio",
  wma: "audio",
  m4a: "audio",
  opus: "audio",
}

export function getFileExtension(filename: string): string {
  return filename.split(".").pop()?.toLowerCase() || ""
}

export function getFileCategory(extension: string): FileCategory {
  return EXTENSION_MAP[extension] || "unknown"
}

export function createStoredFileInfo(file: File, id: string): StoredFileInfo {
  const extension = getFileExtension(file.name)
  const category = getFileCategory(extension)

  return {
    id,
    name: file.name,
    size: file.size,
    type: file.type,
    extension,
    category,
  }
}

export function createFileInfo(file: File, id: string = crypto.randomUUID()): FileInfo {
  const storedFileInfo = createStoredFileInfo(file, id)

  return {
    ...storedFileInfo,
    file,
  }
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes"
  
  const k = 1024
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
}

export function isLargeFile(bytes: number): boolean {
  const TEN_MB = 10 * 1024 * 1024
  return bytes > TEN_MB
}

export function getCategoryLabel(category: FileCategory): string {
  const labels: Record<FileCategory, string> = {
    document: "Document",
    image: "Image",
    video: "Video",
    audio: "Audio",
    unknown: "File",
  }
  return labels[category]
}

export function getCategoryColor(category: FileCategory): string {
  const colors: Record<FileCategory, string> = {
    document: "text-blue-500",
    image: "text-green-500",
    video: "text-purple-500",
    audio: "text-orange-500",
    unknown: "text-muted-foreground",
  }
  return colors[category]
}
