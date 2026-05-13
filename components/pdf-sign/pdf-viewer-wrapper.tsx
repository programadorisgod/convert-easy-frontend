/**
 * PDF Viewer Wrapper component.
 * Wraps @embedpdf/react-pdf-viewer with resize observation and callbacks.
 */

"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import PDFViewer, { PDFViewerRef, PDFViewerProps } from "@embedpdf/react-pdf-viewer";
import type { EmbedPdfContainer, PluginRegistry } from "@embedpdf/snippet";

export interface PdfViewerWrapperProps {
  /** PDF file to display */
  file: File | Blob | string | null;
  /** Initial page number (0-indexed) */
  initialPage?: number;
  /** Initial zoom level */
  initialZoom?: number;
  /** Callback when page changes */
  onPageChange?: (page: number, totalPages: number) => void;
  /** Callback when zoom changes */
  onZoomChange?: (zoom: number) => void;
  /** Callback when container resizes */
  onContainerResize?: (size: { width: number; height: number }) => void;
  /** Callback when PDF loads */
  onDocumentLoad?: (info: { numPages: number }) => void;
  /** Callback when the embedpdf registry is ready */
  onReady?: (registry: PluginRegistry) => void;
  /** Overlay rendered inside the relative container (shares stacking context with embedpdf) */
  overlay?: ReactNode;
  /** CSS class for container */
  className?: string;
  /** Enable scroll mode */
  scroll?: boolean;
  /** Show toolbar */
  toolbar?: boolean;
  /** Show sidebar */
  sidebar?: boolean;
}

export function PdfViewerWrapper({
  file,
  initialPage = 0,
  initialZoom = 1.0,
  onPageChange,
  onZoomChange,
  onContainerResize,
  onDocumentLoad,
  onReady,
  overlay,
  className,
  scroll = true,
  toolbar = true,
  sidebar = false,
}: PdfViewerWrapperProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<PDFViewerRef>(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

  // Get file URL from File/Blob
  const fileUrl = useCallback(() => {
    if (!file) return undefined;
    if (typeof file === "string") return file;
    return URL.createObjectURL(file);
  }, [file]);

  // Track container resize
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      setContainerSize({ width, height });
      onContainerResize?.({ width, height });
    });

    observer.observe(container);
    return () => observer.disconnect();
  }, [onContainerResize]);

  // Handle viewer init
  const handleInit = useCallback(
    (container: EmbedPdfContainer) => {
      console.log("PDF viewer initialized", container);
    },
    []
  );

  // Build config for PDFViewer
  const viewerConfig = file
    ? ({
        src: fileUrl() || "",
        theme: { preference: "system" as const },
      } as PDFViewerProps["config"])
    : undefined;

  if (!file) {
    return (
      <div ref={containerRef} className={className}>
        <div className="flex h-full items-center justify-center text-muted-foreground">
          <p>No PDF file selected</p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ width: "100%", height: "100%", position: "relative" }}
    >
      <PDFViewer
        ref={viewerRef}
        config={viewerConfig}
        className="w-full h-full"
        onInit={handleInit}
        onReady={onReady}
      />
      {overlay}
    </div>
  );
}
