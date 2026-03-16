"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ArrowLeft, AlertCircle, SlidersHorizontal } from "lucide-react";
import Link from "next/link";

import { Header } from "@/components/header";
import { FilePreview } from "@/components/editor/file-preview";
import { ActionSidebar } from "@/components/editor/action-sidebar";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  createFilePreviewUrl,
  getFile,
  revokeFilePreviewUrl,
} from "@/lib/file-store";
import type { StoredFileInfo } from "@/types/file";

function EditorContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const fileId = searchParams.get("file");

  const [fileInfo, setFileInfo] = useState<StoredFileInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [convertedFileName, setConvertedFileName] = useState<string | null>(
    null,
  );
  const [previewUrl, setPreviewUrl] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (
      !fileInfo ||
      !["image", "video", "audio", "document"].includes(fileInfo.category)
    ) {
      setPreviewUrl(undefined);
      return;
    }

    const file = getFile(fileInfo.id);
    if (!file) {
      setPreviewUrl(undefined);
      return;
    }

    const nextPreviewUrl = createFilePreviewUrl(file);
    setPreviewUrl(nextPreviewUrl);

    return () => {
      revokeFilePreviewUrl(nextPreviewUrl);
    };
  }, [fileInfo]);

  useEffect(() => {
    // Try to get file info from sessionStorage
    const stored = sessionStorage.getItem("pendingFile");

    if (stored) {
      try {
        const parsed = JSON.parse(stored) as StoredFileInfo;
        if (parsed.id === fileId) {
          // Verify file exists in memory store
          const file = getFile(parsed.id);
          if (file) {
            setFileInfo(parsed);
            setIsLoading(false);
            return;
          }
          // File not in memory, clear sessionStorage
          sessionStorage.removeItem("pendingFile");
        }
      } catch {
        // Invalid JSON, clear it
        sessionStorage.removeItem("pendingFile");
      }
    }

    // No valid file found
    setError("No file selected. Please upload a file first.");
    setIsLoading(false);
  }, [fileId]);

  const handleActionSelect = (
    actionId: string,
    options?: Record<string, unknown>,
  ) => {
    console.log("[v0] Action selected:", actionId, options);
    // Future: Implement actual file processing
  };

  const handleConversionComplete = (fileName: string | null) => {
    setConvertedFileName(fileName);
  };

  const handleFileUpdate = (updatedFileInfo: StoredFileInfo) => {
    sessionStorage.setItem("pendingFile", JSON.stringify(updatedFileInfo));
    setConvertedFileName(null);
    setFileInfo(updatedFileInfo);
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
          <p className="mt-4 text-muted-foreground">Loading file...</p>
        </div>
      </div>
    );
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
    );
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
          fileId={fileInfo.id}
          inputFormat={fileInfo.extension}
          onActionSelect={handleActionSelect}
          onConversionComplete={handleConversionComplete}
          onFileUpdate={handleFileUpdate}
          className="hidden md:flex"
        />

        {/* Main preview area */}
        <main className="flex flex-1 flex-col overflow-auto p-3 md:p-6">
          <FilePreview
            name={fileInfo.name}
            size={fileInfo.size}
            category={fileInfo.category}
            extension={fileInfo.extension}
            previewUrl={previewUrl}
            conversionCompletedFileName={convertedFileName}
          />
        </main>
      </div>

      {/* Mobile action bar */}
      <div className="border-t bg-card p-3 md:hidden">
        <Sheet>
          <SheetTrigger asChild>
            <Button className="w-full gap-2" size="sm">
              <SlidersHorizontal className="h-4 w-4" />
              Abrir acciones
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[88vh] p-0">
            <SheetHeader className="border-b pb-3">
              <SheetTitle>Acciones del archivo</SheetTitle>
            </SheetHeader>
            <div className="h-[calc(88vh-56px)] overflow-hidden">
              <ActionSidebar
                category={fileInfo.category}
                fileName={fileInfo.name}
                fileSize={fileInfo.size}
                fileId={fileInfo.id}
                inputFormat={fileInfo.extension}
                onActionSelect={handleActionSelect}
                onConversionComplete={handleConversionComplete}
                onFileUpdate={handleFileUpdate}
                className="flex h-full w-full border-0"
              />
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
}

function EditorLoadingFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
        <p className="mt-4 text-muted-foreground">Loading editor...</p>
      </div>
    </div>
  );
}

export default function EditorPage() {
  return (
    <Suspense fallback={<EditorLoadingFallback />}>
      <EditorContent />
    </Suspense>
  );
}
