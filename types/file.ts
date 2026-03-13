import type { LucideIcon } from "lucide-react"

export type FileCategory = "document" | "image" | "video" | "audio" | "unknown"

export type FileState = 
  | "idle"
  | "selected"
  | "uploading"
  | "queued"
  | "processing"
  | "completed"
  | "error"

export interface FileInfo {
  id: string
  name: string
  size: number
  type: string
  extension: string
  category: FileCategory
  file: File
  previewUrl?: string
}

export interface StoredFileInfo {
  id: string
  name: string
  size: number
  type: string
  extension: string
  category: FileCategory
}

export interface FileAction {
  id: string
  label: string
  description: string
  icon: LucideIcon
  category: FileCategory[]
}

export interface ConversionOption {
  id: string
  label: string
  extension: string
  description?: string
}

export interface FileProcessingState {
  state: FileState
  progress: number
  error?: string
  result?: {
    downloadUrl: string
    fileName: string
  }
}
