"use client"

import { Suspense, useEffect, useMemo, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { ArrowLeft, AlertCircle } from "lucide-react"
import Link from "next/link"

import { Header } from "@/components/header"
import { FilePreview } from "@/components/editor/file-preview"
import { ActionSidebar } from "@/components/editor/action-sidebar"
import { Button } from "@/components/ui/button"
import { getFile, createFilePreviewUrl } from "@/lib/file-store"
import type { FileCategory } from "@/types/file"

interface StoredFileInfo {
  id: string
  name: string
  size: number
  type: string
  extension: string
  category: FileCategory
}

function EditorContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const fileId = searchParams.get("file")
  
  const [fileInfo, setFileInfo] = useState<StoredFileInfo | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Create preview URL for audio/video/image files
  const previewUrl = useMemo(() => {
    if (!fileInfo) return undefined
    const file = getFile(fileInfo.id)
    if (!file) return undefined
    
    // Only create preview URLs for media files
    if (["image", "video", "audio"].includes(fileInfo.category)) {
      return createFilePreviewUrl(file)
    }
    return undefined
  }, [fileInfo])

  useEffect(() => {
    // Try to get file info from sessionStorage
    const stored = sessionStorage.getItem("pendingFile")
    
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as StoredFileInfo
        if (parsed.id === fileId) {
          setFileInfo(parsed)
          setIsLoading(false)
          return
        }
      } catch {
        // Invalid JSON, clear it
        sessionStorage.removeItem("pendingFile")
      }
    }

    // No valid file found
    setError("No file selected. Please upload a file first.")
    setIsLoading(false)
  }, [fileId])

  const handleActionSelect = (actionId: string, options?: Record<string, unknown>) => {
    console.log("[v0] Action selected:", actionId, options)
    // Future: Implement actual file processing
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
          <p className="mt-4 text-muted-foreground">Loading file...</p>
        </div>
      </div>
    )
  }

  if (error || !fileInfo) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto flex flex-col items-center justify-center px-4 py-20">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
            <AlertCircle className="h-8 w-8 text-destructive" />
          </div>
          <h1 className="mt-6 text-xl font-semibold text-foreground">
            {error || "File not found"}
          </h1>
          <p className="mt-2 text-muted-foreground">
            Please go back and upload a file to continue.
          </p>
          <Link href="/" className="mt-6">
            <Button>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Button>
          </Link>
        </main>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      
      {/* Editor toolbar */}
      <div className="border-b bg-card px-4 py-2">
        <div className="container mx-auto flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          </Link>
          <div className="h-4 w-px bg-border" />
          <h1 className="text-sm font-medium text-foreground truncate">
            {fileInfo.name}
          </h1>
        </div>
      </div>

      {/* Editor content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <ActionSidebar
          category={fileInfo.category}
          fileName={fileInfo.name}
          fileSize={fileInfo.size}
          onActionSelect={handleActionSelect}
          className="hidden md:flex"
        />

        {/* Main preview area */}
        <main className="flex flex-1 flex-col overflow-auto p-6">
          <FilePreview
            name={fileInfo.name}
            size={fileInfo.size}
            category={fileInfo.category}
            extension={fileInfo.extension}
            previewUrl={previewUrl}
          />
        </main>
      </div>

      {/* Mobile action bar */}
      <div className="flex gap-2 border-t bg-card p-4 md:hidden overflow-x-auto">
        <Button variant="default" size="sm" className="shrink-0">
          Convert
        </Button>
        <Button variant="outline" size="sm" className="shrink-0">
          Compress
        </Button>
        <Button variant="outline" size="sm" className="shrink-0">
          Optimize
        </Button>
      </div>
    </div>
  )
}

function EditorLoadingFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
        <p className="mt-4 text-muted-foreground">Loading editor...</p>
      </div>
    </div>
  )
}

export default function EditorPage() {
  return (
    <Suspense fallback={<EditorLoadingFallback />}>
      <EditorContent />
    </Suspense>
  )
}
