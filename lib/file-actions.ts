import {
  FileType,
  Layers,
  PenTool,
  Lock,
  Unlock,
  Archive,
  Zap,
  Sparkles,
  Eraser,
  Crop,
  Maximize,
  Stamp,
  User,
  Music,
  Scissors,
  Volume2,
  Film,
  type LucideIcon,
} from "lucide-react"
import type { FileCategory, FileAction, ConversionOption } from "@/types/file"

export const FILE_ACTIONS: FileAction[] = [
  // Document actions
  {
    id: "convert",
    label: "Convert",
    description: "Convert to different format",
    icon: FileType,
    category: ["document", "image", "video", "audio"],
  },
  {
    id: "organize",
    label: "Organize",
    description: "Merge, split, or reorder pages",
    icon: Layers,
    category: ["document"],
  },
  {
    id: "sign",
    label: "Sign",
    description: "Add digital signature",
    icon: PenTool,
    category: ["document"],
  },
  {
    id: "protect",
    label: "Protect",
    description: "Add password protection",
    icon: Lock,
    category: ["document"],
  },
  {
    id: "unlock",
    label: "Unlock",
    description: "Remove password protection",
    icon: Unlock,
    category: ["document"],
  },
  {
    id: "compress",
    label: "Compress",
    description: "Reduce file size",
    icon: Archive,
    category: ["document", "image", "video"],
  },
  
  // Image actions
  {
    id: "optimize",
    label: "Optimize",
    description: "Optimize for web",
    icon: Zap,
    category: ["image"],
  },
  {
    id: "enhance",
    label: "Enhance",
    description: "AI-powered enhancement",
    icon: Sparkles,
    category: ["image"],
  },
  {
    id: "remove-bg",
    label: "Remove Background",
    description: "Remove image background",
    icon: Eraser,
    category: ["image"],
  },
  {
    id: "crop",
    label: "Crop",
    description: "Crop and resize",
    icon: Crop,
    category: ["image", "video"],
  },
  {
    id: "upscale",
    label: "Upscale",
    description: "AI-powered upscaling",
    icon: Maximize,
    category: ["image"],
  },
  {
    id: "watermark",
    label: "Watermark",
    description: "Add watermark",
    icon: Stamp,
    category: ["image", "video"],
  },
  {
    id: "blur-face",
    label: "Blur Face",
    description: "Detect and blur faces",
    icon: User,
    category: ["image", "video"],
  },
  
  // Video actions
  {
    id: "extract-audio",
    label: "Extract Audio",
    description: "Extract audio track",
    icon: Music,
    category: ["video"],
  },
  {
    id: "trim",
    label: "Trim",
    description: "Cut video segments",
    icon: Scissors,
    category: ["video", "audio"],
  },
  
  // Audio actions
  {
    id: "normalize",
    label: "Normalize",
    description: "Normalize audio levels",
    icon: Volume2,
    category: ["audio"],
  },
]

export function getActionsForCategory(category: FileCategory): FileAction[] {
  return FILE_ACTIONS.filter((action) => action.category.includes(category))
}

// Conversion options by file category
export const CONVERSION_OPTIONS: Record<FileCategory, ConversionOption[]> = {
  document: [
    { id: "pdf", label: "PDF", extension: "pdf", description: "Portable Document Format" },
    { id: "docx", label: "DOCX", extension: "docx", description: "Microsoft Word" },
    { id: "html", label: "HTML", extension: "html", description: "Web Page" },
    { id: "md", label: "Markdown", extension: "md", description: "Markdown Text" },
    { id: "odt", label: "ODT", extension: "odt", description: "OpenDocument Text" },
    { id: "txt", label: "Plain Text", extension: "txt", description: "Text File" },
  ],
  image: [
    { id: "png", label: "PNG", extension: "png", description: "Lossless compression" },
    { id: "jpg", label: "JPG", extension: "jpg", description: "Lossy compression" },
    { id: "webp", label: "WebP", extension: "webp", description: "Modern web format" },
    { id: "avif", label: "AVIF", extension: "avif", description: "Next-gen format" },
    { id: "svg", label: "SVG", extension: "svg", description: "Vector graphics" },
    { id: "gif", label: "GIF", extension: "gif", description: "Animated images" },
  ],
  video: [
    { id: "mp4", label: "MP4", extension: "mp4", description: "Universal format" },
    { id: "mkv", label: "MKV", extension: "mkv", description: "Matroska Video" },
    { id: "webm", label: "WebM", extension: "webm", description: "Web video format" },
    { id: "avi", label: "AVI", extension: "avi", description: "Legacy format" },
    { id: "mov", label: "MOV", extension: "mov", description: "Apple QuickTime" },
  ],
  audio: [
    { id: "mp3", label: "MP3", extension: "mp3", description: "Universal format" },
    { id: "flac", label: "FLAC", extension: "flac", description: "Lossless audio" },
    { id: "wav", label: "WAV", extension: "wav", description: "Uncompressed audio" },
    { id: "ogg", label: "OGG", extension: "ogg", description: "Open format" },
    { id: "aac", label: "AAC", extension: "aac", description: "Advanced Audio" },
  ],
  unknown: [],
}

const SPREADSHEET_INPUT_FORMATS = new Set(["xls", "xlsx"])

const SPREADSHEET_CONVERSION_OPTIONS: ConversionOption[] = [
  { id: "pdf", label: "PDF", extension: "pdf", description: "Portable Document Format" },
  { id: "html", label: "HTML", extension: "html", description: "Web Page" },
  { id: "csv", label: "CSV", extension: "csv", description: "Comma Separated Values" },
]

const PDF_CONVERSION_OPTIONS: ConversionOption[] = CONVERSION_OPTIONS.document.filter(
  (option) => option.extension !== "md",
)

export function getConversionOptions(
  category: FileCategory,
  inputFormat?: string,
): ConversionOption[] {
  const normalizedInputFormat = inputFormat?.toLowerCase()

  if (
    category === "document" &&
    normalizedInputFormat &&
    SPREADSHEET_INPUT_FORMATS.has(normalizedInputFormat)
  ) {
    return SPREADSHEET_CONVERSION_OPTIONS
  }

  if (category === "document" && normalizedInputFormat === "pdf") {
    return PDF_CONVERSION_OPTIONS
  }

  return CONVERSION_OPTIONS[category] || []
}

// Icon mapping for file categories
export const CATEGORY_ICONS: Record<FileCategory, LucideIcon> = {
  document: FileType,
  image: Crop,
  video: Film,
  audio: Music,
  unknown: FileType,
}
