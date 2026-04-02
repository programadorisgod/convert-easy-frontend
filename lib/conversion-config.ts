import {
  FileText,
  FileType,
  Film,
  Music,
  ArrowRightLeft,
  Layers,
  PenTool,
  Lock,
  Archive,
  Scissors,
  Volume2,
  type LucideIcon,
} from "lucide-react";
import type { FileCategory } from "@/types/file";

export interface ConversionConfig {
  slug: string;
  label: string;
  description: string;
  sourceExtensions: string[];
  targetFormat: string;
  category: FileCategory;
  icon: LucideIcon;
  href: string;
}

export interface ToolConfig {
  slug: string;
  label: string;
  description: string;
  category: FileCategory;
  icon: LucideIcon;
  href: string;
}

export const CONVERSION_CONFIGS: Record<string, ConversionConfig> = {
  "docx-to-pdf": {
    slug: "docx-to-pdf",
    label: "DOCX to PDF",
    description: "Convert Word documents to PDF format",
    sourceExtensions: [".docx", ".doc"],
    targetFormat: "pdf",
    category: "document",
    icon: ArrowRightLeft,
    href: "/convert/docx-to-pdf",
  },
  "docx-to-html": {
    slug: "docx-to-html",
    label: "DOCX to HTML",
    description: "Convert Word documents to HTML format",
    sourceExtensions: [".docx", ".doc"],
    targetFormat: "html",
    category: "document",
    icon: ArrowRightLeft,
    href: "/convert/docx-to-html",
  },
  "docx-to-md": {
    slug: "docx-to-md",
    label: "DOCX to Markdown",
    description: "Convert Word documents to Markdown format",
    sourceExtensions: [".docx", ".doc"],
    targetFormat: "md",
    category: "document",
    icon: ArrowRightLeft,
    href: "/convert/docx-to-md",
  },
  "docx-to-odt": {
    slug: "docx-to-odt",
    label: "DOCX to ODT",
    description: "Convert Word documents to OpenDocument format",
    sourceExtensions: [".docx", ".doc"],
    targetFormat: "odt",
    category: "document",
    icon: ArrowRightLeft,
    href: "/convert/docx-to-odt",
  },
  "pdf": {
    slug: "pdf",
    label: "Convert PDF",
    description: "Convert PDF to other formats",
    sourceExtensions: [".pdf"],
    targetFormat: "multiple",
    category: "document",
    icon: ArrowRightLeft,
    href: "/convert/pdf",
  },
  "video-to-mp4": {
    slug: "video-to-mp4",
    label: "Convert to MP4",
    description: "Convert video to MP4 format",
    sourceExtensions: [".mp4", ".avi", ".mov", ".mkv", ".webm"],
    targetFormat: "mp4",
    category: "video",
    icon: ArrowRightLeft,
    href: "/convert/video-to-mp4",
  },
  "video-to-mkv": {
    slug: "video-to-mkv",
    label: "Convert to MKV",
    description: "Convert video to MKV format",
    sourceExtensions: [".mp4", ".avi", ".mov", ".webm"],
    targetFormat: "mkv",
    category: "video",
    icon: ArrowRightLeft,
    href: "/convert/video-to-mkv",
  },
  "video-to-webm": {
    slug: "video-to-webm",
    label: "Convert to WebM",
    description: "Convert video to WebM format",
    sourceExtensions: [".mp4", ".avi", ".mov", ".mkv"],
    targetFormat: "webm",
    category: "video",
    icon: ArrowRightLeft,
    href: "/convert/video-to-webm",
  },
  "audio-to-mp3": {
    slug: "audio-to-mp3",
    label: "Convert to MP3",
    description: "Convert audio to MP3 format",
    sourceExtensions: [".mp3", ".wav", ".flac", ".aac", ".ogg", ".m4a"],
    targetFormat: "mp3",
    category: "audio",
    icon: ArrowRightLeft,
    href: "/convert/audio-to-mp3",
  },
  "audio-to-flac": {
    slug: "audio-to-flac",
    label: "Convert to FLAC",
    description: "Convert audio to FLAC format",
    sourceExtensions: [".mp3", ".wav", ".aac", ".ogg", ".m4a"],
    targetFormat: "flac",
    category: "audio",
    icon: ArrowRightLeft,
    href: "/convert/audio-to-flac",
  },
  "audio-to-wav": {
    slug: "audio-to-wav",
    label: "Convert to WAV",
    description: "Convert audio to WAV format",
    sourceExtensions: [".mp3", ".flac", ".aac", ".ogg", ".m4a"],
    targetFormat: "wav",
    category: "audio",
    icon: ArrowRightLeft,
    href: "/convert/audio-to-wav",
  },
};

export const TOOL_CONFIGS: Record<string, ToolConfig> = {
  "pdf-organize": {
    slug: "pdf-organize",
    label: "Organize PDF",
    description: "Merge, split, or reorder pages",
    category: "document",
    icon: Layers,
    href: "/tools/pdf-organize",
  },
  "pdf-sign": {
    slug: "pdf-sign",
    label: "Sign PDF",
    description: "Add digital signature to PDF",
    category: "document",
    icon: PenTool,
    href: "/tools/pdf-sign",
  },
  "pdf-protect": {
    slug: "pdf-protect",
    label: "Protect PDF",
    description: "Add password protection",
    category: "document",
    icon: Lock,
    href: "/tools/pdf-protect",
  },
  "pdf-compress": {
    slug: "pdf-compress",
    label: "Compress PDF",
    description: "Reduce PDF file size",
    category: "document",
    icon: Archive,
    href: "/tools/pdf-compress",
  },
  "extract-audio": {
    slug: "extract-audio",
    label: "Extract Audio",
    description: "Extract audio track from video",
    category: "video",
    icon: Music,
    href: "/tools/extract-audio",
  },
  "trim-video": {
    slug: "trim-video",
    label: "Trim Video",
    description: "Cut and trim video segments",
    category: "video",
    icon: Scissors,
    href: "/tools/trim-video",
  },
  "trim-audio": {
    slug: "trim-audio",
    label: "Trim Audio",
    description: "Cut and trim audio segments",
    category: "audio",
    icon: Scissors,
    href: "/tools/trim-audio",
  },
  "normalize-audio": {
    slug: "normalize-audio",
    label: "Normalize Audio",
    description: "Normalize audio levels",
    category: "audio",
    icon: Volume2,
    href: "/tools/normalize-audio",
  },
};

export function getConversionConfig(slug: string): ConversionConfig | undefined {
  return CONVERSION_CONFIGS[slug];
}

export function getToolConfig(slug: string): ToolConfig | undefined {
  return TOOL_CONFIGS[slug];
}

export function isValidConversionSlug(slug: string): boolean {
  return slug in CONVERSION_CONFIGS;
}

export function isValidToolSlug(slug: string): boolean {
  return slug in TOOL_CONFIGS;
}

export const CONVERSION_ICONS: Record<FileCategory, LucideIcon> = {
  document: FileText,
  image: FileType,
  video: Film,
  audio: Music,
  unknown: FileText,
};
