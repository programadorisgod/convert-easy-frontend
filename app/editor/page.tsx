"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  AlertCircle,
  SlidersHorizontal,
  Download,
  Sparkles,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { sileo } from "sileo";

import { Header } from "@/components/header";
import { FilePreview } from "@/components/editor/file-preview";
import {
  ActionSidebar,
  type ConversionCompleteDetails,
} from "@/components/editor/action-sidebar";
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
import { downloadResult } from "@/lib/api-service";
import type { StoredFileInfo } from "@/types/file";

interface ConversionContext {
  slug: string;
  targetFormat: string;
}

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
  const [readyDownload, setReadyDownload] = useState<{
    fileName: string;
    jobId?: string;
    format?: string;
    blobUrl?: string;
    isLocal?: boolean;
    file?: File;
  } | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isMobileSheetOpen, setIsMobileSheetOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | undefined>(undefined);
  const [conversionContext, setConversionContext] = useState<ConversionContext | null>(null);

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
    const storedFile = sessionStorage.getItem("pendingFile");
    const storedConversion = sessionStorage.getItem("conversionContext");

    if (storedFile) {
      try {
        const parsed = JSON.parse(storedFile) as StoredFileInfo;
        if (parsed.id === fileId) {
          const file = getFile(parsed.id);
          if (file) {
            setFileInfo(parsed);
            setIsLoading(false);

            if (storedConversion) {
              try {
                const conversion = JSON.parse(storedConversion) as ConversionContext;
                setConversionContext(conversion);
                sessionStorage.removeItem("conversionContext");
              } catch {
                sessionStorage.removeItem("conversionContext");
              }
            }
            return;
          }
          sessionStorage.removeItem("pendingFile");
        }
      } catch {
        sessionStorage.removeItem("pendingFile");
      }
    }

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

  const handleConversionComplete = (
    fileName: string | null,
    details?: ConversionCompleteDetails,
  ) => {
    setConvertedFileName(fileName);
    if (fileName) {
      setReadyDownload({
        fileName,
        ...details,
      });
      // Close mobile sheet on completion so the user directly sees their download CTA
      setIsMobileSheetOpen(false);
    } else {
      setReadyDownload(null);
    }
  };

  const handleFileUpdate = (updatedFileInfo: StoredFileInfo) => {
    sessionStorage.setItem("pendingFile", JSON.stringify(updatedFileInfo));
    setFileInfo(updatedFileInfo);
  };

  const handleExecuteDownload = async () => {
    if (!readyDownload) return;
    setIsDownloading(true);

    try {
      if (readyDownload.blobUrl) {
        const a = document.createElement("a");
        a.href = readyDownload.blobUrl;
        a.download = readyDownload.fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      } else if (readyDownload.isLocal || readyDownload.file) {
        const fileToDownload =
          readyDownload.file || (fileInfo ? getFile(fileInfo.id) : null);
        if (!fileToDownload) {
          throw new Error("No se encontró el archivo local para descargar.");
        }
        const url = URL.createObjectURL(fileToDownload);
        const a = document.createElement("a");
        a.href = url;
        a.download = readyDownload.fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else if (readyDownload.jobId && readyDownload.format) {
        const blob = await downloadResult(
          readyDownload.jobId,
          readyDownload.format,
        );
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = readyDownload.fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else if (fileInfo) {
        const file = getFile(fileInfo.id);
        if (file) {
          const url = URL.createObjectURL(file);
          const a = document.createElement("a");
          a.href = url;
          a.download = readyDownload.fileName;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }
      }

      sileo.success({
        title: "¡Descarga iniciada!",
        description: readyDownload.fileName,
        icon: <Sparkles className="size-3.5" />,
        roundness: 16,
        duration: 3000,
      });
    } catch (error) {
      sileo.error({
        title: "Error al descargar",
        description:
          error instanceof Error
            ? error.message
            : "No se pudo descargar el archivo",
        roundness: 16,
        duration: 4000,
      });
    } finally {
      setIsDownloading(false);
    }
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
        <div className="container mx-auto flex items-center gap-3 sm:gap-4 min-w-0">
          <Link href="/" className="shrink-0">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          </Link>
          <div className="h-4 w-px bg-border shrink-0" />
          <h1 className="text-sm font-medium text-foreground truncate min-w-0 flex-1">
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
            readyDownload={readyDownload}
            onDownload={handleExecuteDownload}
            isDownloading={isDownloading}
          />
        </main>
      </div>

      {/* Mobile action bar */}
      <div className="border-t bg-card p-3 md:hidden">
        {readyDownload ? (
          <div className="flex items-center gap-2">
            <Button
              className="flex-1 gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium shadow-sm h-11"
              size="default"
              onClick={handleExecuteDownload}
              disabled={isDownloading}
            >
              {isDownloading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Descargando...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4" />
                  Descargar {readyDownload.fileName.split(".").pop()?.toUpperCase()}
                </>
              )}
            </Button>
            <Sheet
              open={isMobileSheetOpen}
              onOpenChange={setIsMobileSheetOpen}
            >
              <SheetTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-11 w-11 shrink-0"
                  aria-label="Abrir acciones"
                >
                  <SlidersHorizontal className="h-4 w-4" />
                </Button>
              </SheetTrigger>
              <SheetContent side="bottom" className="h-[88vh] p-0">
                <SheetHeader className="border-b pb-3 px-4 pt-3">
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
        ) : (
          <Sheet open={isMobileSheetOpen} onOpenChange={setIsMobileSheetOpen}>
            <SheetTrigger asChild>
              <Button className="w-full gap-2 h-11" size="default">
                <SlidersHorizontal className="h-4 w-4" />
                Abrir acciones
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-[88vh] p-0">
              <SheetHeader className="border-b pb-3 px-4 pt-3">
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
        )}
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
