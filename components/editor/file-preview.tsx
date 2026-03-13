"use client";

import dynamic from "next/dynamic";
import { FileText, Image, Film, Music, File, Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";
import { formatFileSize } from "@/lib/file-utils";
import type { FileCategory } from "@/types/file";
import { ElementType, useEffect, useMemo, useState } from "react";

const DocViewerWithRenderers = dynamic(
  async () => {
    const module = await import("react-doc-viewer");
    const WrappedDocViewer = (props: any) => (
      <module.default {...props} pluginRenderers={module.DocViewerRenderers} />
    );

    return WrappedDocViewer;
  },
  { ssr: false },
);

const MarkdownPreview = dynamic(
  () => import("@uiw/react-markdown-preview").then((module) => module.default),
  {
    ssr: false,
  },
);

const DOC_VIEWER_SUPPORTED_EXTENSIONS = new Set([
  "bmp",
  "htm",
  "html",
  "jpg",
  "jpeg",
  "png",
  "tiff",
  "txt",
]);

const CATEGORY_ICONS: Record<FileCategory, ElementType> = {
  document: FileText,
  image: Image,
  video: Film,
  audio: Music,
  unknown: File,
};

interface FilePreviewProps {
  name: string;
  size: number;
  category: FileCategory;
  extension: string;
  previewUrl?: string;
  isProcessing?: boolean;
  conversionCompletedFileName?: string | null;
  className?: string;
}

export function FilePreview({
  name,
  size,
  category,
  extension,
  previewUrl,
  isProcessing = false,
  conversionCompletedFileName = null,
  className,
}: FilePreviewProps) {
  const IconComponent = CATEGORY_ICONS[category];
  const normalizedExtension = extension.toLowerCase();
  const isPdfDocument =
    category === "document" && normalizedExtension === "pdf";
  const isTxtDocument =
    category === "document" && normalizedExtension === "txt";
  const isMarkdownDocument =
    category === "document" && normalizedExtension === "md";
  const isDocViewerDocument =
    category === "document" &&
    DOC_VIEWER_SUPPORTED_EXTENSIONS.has(normalizedExtension);
  const [markdownSource, setMarkdownSource] = useState<string>("");
  const [markdownLoadFailed, setMarkdownLoadFailed] = useState(false);

  useEffect(() => {
    if (!previewUrl || !isMarkdownDocument) {
      setMarkdownSource("");
      setMarkdownLoadFailed(false);
      return;
    }

    const abortController = new AbortController();

    const loadMarkdown = async () => {
      try {
        const response = await fetch(previewUrl, {
          signal: abortController.signal,
        });
        if (!response.ok) {
          throw new Error("No se pudo cargar el markdown");
        }

        const content = await response.text();
        setMarkdownSource(content);
        setMarkdownLoadFailed(false);
      } catch {
        if (!abortController.signal.aborted) {
          setMarkdownSource("");
          setMarkdownLoadFailed(true);
        }
      }
    };

    loadMarkdown();

    return () => {
      abortController.abort();
    };
  }, [previewUrl, isMarkdownDocument]);

  const documentPreview = useMemo(() => {
    if (!previewUrl || category !== "document") {
      return null;
    }

    if (isPdfDocument) {
      return (
        <object
          data={previewUrl}
          type="application/pdf"
          className="h-[74vh] min-h-140 w-full rounded-lg border"
          aria-label={name}
        >
          <iframe
            src={previewUrl}
            className="h-[74vh] min-h-140 w-full rounded-lg border"
            title={name}
          />
        </object>
      );
    }

    if (isMarkdownDocument) {
      if (markdownLoadFailed) {
        return null;
      }

      return (
        <div
          className="h-[74vh] min-h-140 w-full overflow-auto rounded-lg border bg-background p-5"
          data-color-mode="light"
        >
          <MarkdownPreview
            source={markdownSource}
            style={{ backgroundColor: "transparent", color: "inherit" }}
          />
        </div>
      );
    }

    if (isDocViewerDocument) {
      return (
        <div
          className={cn(
            "h-[74vh] min-h-140 w-full overflow-hidden rounded-lg border bg-background",
            isTxtDocument && "bg-white text-black",
          )}
        >
          <DocViewerWithRenderers
            style={{
              height: "100%",
              width: "100%",
              color: isTxtDocument ? "#111827" : undefined,
            }}
            documents={[
              {
                uri: previewUrl,
                fileType: normalizedExtension,
              },
            ]}
            theme={
              isTxtDocument
                ? {
                    text_primary: "#111827",
                    text_secondary: "#111827",
                    text_tertiary: "#111827",
                  }
                : undefined
            }
            config={{
              header: {
                disableHeader: false,
                disableFileName: false,
                retainURLParams: false,
              },
            }}
          />
        </div>
      );
    }

    return null;
  }, [
    previewUrl,
    category,
    isPdfDocument,
    isMarkdownDocument,
    isDocViewerDocument,
    normalizedExtension,
    markdownSource,
    markdownLoadFailed,
  ]);

  return (
    <div
      className={cn(
        "flex flex-1 flex-col rounded-lg border bg-card p-8",
        category === "document" && documentPreview
          ? "items-stretch justify-start"
          : "items-center justify-center",
        className,
      )}
    >
      {/* Preview content */}
      {documentPreview ? (
        documentPreview
      ) : category === "image" && previewUrl ? (
        <div className="relative max-h-100 max-w-full overflow-hidden rounded-lg">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={previewUrl}
            alt={name}
            className="h-auto max-h-100 w-auto object-contain"
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
          <audio src={previewUrl} controls className="w-full">
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
      <div
        className={cn(
          "mt-6",
          category === "document" && documentPreview
            ? "text-left"
            : "text-center",
        )}
      >
        <h2 className="text-lg font-semibold text-foreground line-clamp-2">
          {name}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {extension.toUpperCase()} - {formatFileSize(size)}
        </p>

        {category === "document" && !documentPreview && (
          <p className="mt-2 text-xs text-muted-foreground">
            Preview no disponible para este tipo de documento en el navegador.
          </p>
        )}

        {conversionCompletedFileName && (
          <div className="mt-4 rounded-lg border border-green-500/20 bg-green-500/10 px-4 py-3">
            <p className="text-sm font-medium text-green-700 dark:text-green-400">
              ¡Tu archivo está listo!
            </p>
            <p className="mt-1 text-xs text-green-600/80 dark:text-green-400/80">
              {conversionCompletedFileName}
            </p>
          </div>
        )}
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
  );
}
