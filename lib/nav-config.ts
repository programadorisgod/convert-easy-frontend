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
} from "lucide-react"

export interface NavItem {
  label: string
  href: string
  description: string
  icon: LucideIcon
}

export interface NavCategory {
  id: string
  label: string
  icon: LucideIcon
  items: NavItem[]
}

export const NAV_CATEGORIES: NavCategory[] = [
  {
    id: "docx",
    label: "DOCX Tools",
    icon: FileText,
    items: [
      {
        label: "DOCX to PDF",
        href: "/convert/docx-to-pdf",
        description: "Convert Word documents to PDF",
        icon: ArrowRightLeft,
      },
      {
        label: "DOCX to HTML",
        href: "/convert/docx-to-html",
        description: "Convert Word documents to HTML",
        icon: ArrowRightLeft,
      },
      {
        label: "DOCX to Markdown",
        href: "/convert/docx-to-md",
        description: "Convert Word documents to Markdown",
        icon: ArrowRightLeft,
      },
      {
        label: "DOCX to ODT",
        href: "/convert/docx-to-odt",
        description: "Convert Word to OpenDocument",
        icon: ArrowRightLeft,
      },
    ],
  },
  {
    id: "pdf",
    label: "PDF Tools",
    icon: FileType,
    items: [
      {
        label: "Convert PDF",
        href: "/convert/pdf",
        description: "Convert PDF to other formats",
        icon: ArrowRightLeft,
      },
      {
        label: "Organize PDF",
        href: "/tools/pdf-organize",
        description: "Merge, split, or reorder pages",
        icon: Layers,
      },
      {
        label: "Sign PDF",
        href: "/tools/pdf-sign",
        description: "Add digital signature to PDF",
        icon: PenTool,
      },
      {
        label: "Protect PDF",
        href: "/tools/pdf-protect",
        description: "Add password protection",
        icon: Lock,
      },
      {
        label: "Compress PDF",
        href: "/tools/pdf-compress",
        description: "Reduce PDF file size",
        icon: Archive,
      },
    ],
  },
  {
    id: "video",
    label: "Video Tools",
    icon: Film,
    items: [
      {
        label: "Convert to MP4",
        href: "/convert/video-to-mp4",
        description: "Convert video to MP4 format",
        icon: ArrowRightLeft,
      },
      {
        label: "Convert to MKV",
        href: "/convert/video-to-mkv",
        description: "Convert video to MKV format",
        icon: ArrowRightLeft,
      },
      {
        label: "Convert to WebM",
        href: "/convert/video-to-webm",
        description: "Convert video to WebM format",
        icon: ArrowRightLeft,
      },
      {
        label: "Extract Audio",
        href: "/tools/extract-audio",
        description: "Extract audio track from video",
        icon: Music,
      },
      {
        label: "Trim Video",
        href: "/tools/trim-video",
        description: "Cut and trim video segments",
        icon: Scissors,
      },
    ],
  },
  {
    id: "audio",
    label: "Audio Tools",
    icon: Music,
    items: [
      {
        label: "Convert to MP3",
        href: "/convert/audio-to-mp3",
        description: "Convert audio to MP3 format",
        icon: ArrowRightLeft,
      },
      {
        label: "Convert to FLAC",
        href: "/convert/audio-to-flac",
        description: "Convert audio to FLAC format",
        icon: ArrowRightLeft,
      },
      {
        label: "Convert to WAV",
        href: "/convert/audio-to-wav",
        description: "Convert audio to WAV format",
        icon: ArrowRightLeft,
      },
      {
        label: "Trim Audio",
        href: "/tools/trim-audio",
        description: "Cut and trim audio segments",
        icon: Scissors,
      },
      {
        label: "Normalize Audio",
        href: "/tools/normalize-audio",
        description: "Normalize audio levels",
        icon: Volume2,
      },
    ],
  },
]
