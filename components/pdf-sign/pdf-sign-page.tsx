/**
 * PDF Sign Page - Orchestrator component.
 * Handles PDF loading, signature selection, position, and signing.
 */

"use client";

import { useCallback, useRef, useState, useEffect } from "react";
import type { PluginRegistry } from "@embedpdf/react-pdf-viewer";
import { ZoomPlugin, ViewportPlugin } from "@embedpdf/react-pdf-viewer";
import { Upload, FileSignature, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type {
  StoredSignature,
  SignaturePosition,
  SignatureSize,
  PrecomputedPdfCoords,
} from "@/types/signature";
import { useSignatureStore } from "@/hooks/use-signature-store";
import { usePdfSigning } from "@/hooks/use-pdf-signing";
import { getPdfPageSize } from "@/lib/pdf-signing";
import { SignaturePicker } from "@/components/signature/signature-picker";
import { PdfViewerWrapper } from "@/components/pdf-sign/pdf-viewer-wrapper";
import { sileo } from "sileo";

export interface PdfSignPageProps {
  /** Initial PDF file */
  initialFile?: File | null;
  /** CSS class for container */
  className?: string;
}

export function PdfSignPage({ initialFile, className }: PdfSignPageProps) {
  // PDF state
  const [pdfFile, setPdfFile] = useState<File | null>(initialFile ?? null);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [zoom, setZoom] = useState(1.0);
  const [pageSize, setPageSize] = useState({ width: 612, height: 792 }); // Default Letter

  // Signature state
  const { signatures, isLoading, save, delete: deleteSig } = useSignatureStore();
  const [selectedSignature, setSelectedSignature] = useState<StoredSignature | null>(null);

  // Overlay position/size (relative to viewer container)
  const [overlayPosition, setOverlayPosition] = useState<SignaturePosition>({ x: 100, y: 100 });
  const [overlaySize, setOverlaySize] = useState<SignatureSize>({ width: 200, height: 80 });
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [activeHandle, setActiveHandle] = useState<string | null>(null);
  const [dragStart, setDragStart] = useState<{ x: number; y: number; startX: number; startY: number } | null>(null);

  // Registry reference for embedpdf plugin access
  const registryRef = useRef<PluginRegistry | null>(null);
  // Reactive scroll tracking — updated on every viewport scroll change
  const scrollRef = useRef({ x: 0, y: 0 });
  // Store unsubscribe functions for cleanup
  const cleanupsRef = useRef<Array<() => void>>([]);

  const handleRegistryReady = useCallback((registry: PluginRegistry) => {
    registryRef.current = registry;

    // Subscribe to zoom changes to keep React state in sync
    try {
      const zoomPlugin = registry.getPlugin<ZoomPlugin>("zoom");
      if (zoomPlugin) {
        const zoomCapability = zoomPlugin.provides();
        if (zoomCapability) {
          // Get initial zoom level
          const zoomState = zoomCapability.getState();
          if (zoomState && zoomState.currentZoomLevel > 0) {
            setZoom(zoomState.currentZoomLevel);
          }

          // Subscribe to live zoom changes
          const unsubZoom = zoomCapability.onZoomChange?.((event) => {
            setZoom(event.newZoom);
          });
          if (unsubZoom) {
            cleanupsRef.current.push(unsubZoom);
          }
        }
      }
    } catch (err) {
      console.warn("Failed to subscribe to zoom changes", err);
    }

    // Subscribe to viewport scroll changes for accurate coordinate conversion
    try {
      const viewportPlugin = registry.getPlugin<ViewportPlugin>("viewport");
      if (viewportPlugin) {
        const viewport = viewportPlugin.provides();
        if (viewport) {
          // Get initial metrics
          const initialMetrics = viewport.getMetrics();
          if (initialMetrics) {
            scrollRef.current = {
              x: initialMetrics.scrollLeft,
              y: initialMetrics.scrollTop,
            };
          }

          // Subscribe to scroll changes
          const unsubScroll = viewport.onScrollChange?.((event) => {
            scrollRef.current = {
              x: event.scrollMetrics.scrollLeft,
              y: event.scrollMetrics.scrollTop,
            };
          });

          if (unsubScroll) {
            cleanupsRef.current.push(unsubScroll);
          }
        }
      }
    } catch (err) {
      console.warn("Failed to subscribe to viewport scroll", err);
    }
  }, []);

  // Cleanup scroll listeners on unmount
  useEffect(() => {
    return () => {
      cleanupsRef.current.forEach((fn) => fn());
      cleanupsRef.current = [];
    };
  }, []);

  // Signing
  const { status, sign } = usePdfSigning();

  // Container ref for overlay positioning
  const viewerContainerRef = useRef<HTMLDivElement>(null);
  // Ref to overlay DIV — for getBoundingClientRect() position measurement
  // The user positions the visible edge of the overlay (the dashed border),
  // which is the outer div. We measure this for ACCURATE POSITION.
  const overlayRef = useRef<HTMLDivElement>(null);
  // Ref to overlay IMG — for actual rendered image SIZE (excludes the 2px border)
  const overlayImgRef = useRef<HTMLImageElement>(null);
  const [containerSize, setContainerSize] = useState({ width: 800, height: 600 });

  // Update container size on resize
  useEffect(() => {
    const container = viewerContainerRef.current;
    if (!container) return;

    const updateSize = () => {
      setContainerSize({
        width: container.clientWidth,
        height: container.clientHeight,
      });
    };

    updateSize();

    const observer = new ResizeObserver(updateSize);
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  // Handle file selection
  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === "application/pdf") {
      setPdfFile(file);
      sileo.success({
        title: "PDF loaded",
        description: file.name,
        roundness: 16,
        duration: 2000,
      });
    } else {
      sileo.error({
        title: "Invalid file",
        description: "Please select a PDF file",
        roundness: 16,
        duration: 3000,
      });
    }
  }, []);

  // Handle page change
  const handlePageChange = useCallback(async (page: number, total: number) => {
    setCurrentPage(page);
    setTotalPages(total);

    if (pdfFile && page >= 0) {
      try {
        const size = await getPdfPageSize(pdfFile, page + 1);
        setPageSize(size);
      } catch (err) {
        console.error("Failed to get page size:", err);
      }
    }
  }, [pdfFile]);

  // Handle zoom change
  const handleZoomChange = useCallback((newZoom: number) => {
    setZoom(newZoom);
  }, []);

  // Handle signature selection
  const handleSignatureSelect = useCallback((signature: StoredSignature) => {
    setSelectedSignature(signature);
    setOverlayPosition({ x: 150, y: 150 });
    const aspectRatio = signature.width / signature.height;
    const defaultWidth = 300;
    setOverlaySize({
      width: defaultWidth,
      height: defaultWidth / aspectRatio,
    });
  }, []);

  // Handle signature save
  const handleSignatureSave = useCallback(async (
    dataUrl: string,
    name: string,
    width: number,
    height: number,
  ) => {
    const saved = await save(dataUrl, name, width, height);
    if (saved) {
      setSelectedSignature(saved);
    }
  }, [save]);

  // Handle signature delete
  const handleSignatureDelete = useCallback(async (id: string) => {
    await deleteSig(id);
    if (selectedSignature?.id === id) {
      setSelectedSignature(null);
    }
  }, [deleteSig, selectedSignature]);

  // Drag handlers
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!selectedSignature) return;
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    setDragStart({
      x: e.clientX,
      y: e.clientY,
      startX: overlayPosition.x,
      startY: overlayPosition.y,
    });
  }, [selectedSignature, overlayPosition]);

  const handleResizeMouseDown = useCallback((e: React.MouseEvent, handle: string) => {
    if (!selectedSignature) return;
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    setActiveHandle(handle);
    setDragStart({
      x: e.clientX,
      y: e.clientY,
      startX: overlaySize.width,
      startY: overlaySize.height,
    });
  }, [selectedSignature, overlaySize]);

  useEffect(() => {
    if (!isDragging && !isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!dragStart) return;

      const dx = e.clientX - dragStart.x;
      const dy = e.clientY - dragStart.y;

      if (isDragging) {
        const newX = Math.max(0, Math.min(containerSize.width - overlaySize.width, dragStart.startX + dx));
        const newY = Math.max(0, Math.min(containerSize.height - overlaySize.height, dragStart.startY + dy));
        setOverlayPosition({ x: newX, y: newY });
      } else if (isResizing && activeHandle) {
        // Resize maintaining aspect ratio
        const sigWidth = selectedSignature?.width || 200;
        const sigHeight = selectedSignature?.height || 80;
        const aspectRatio = sigWidth / sigHeight;

        let newWidth = dragStart.startX;
        let newHeight = dragStart.startY;

        if (activeHandle.includes("e")) newWidth = Math.max(50, dragStart.startX + dx);
        if (activeHandle.includes("w")) newWidth = Math.max(50, dragStart.startX - dx);
        if (activeHandle.includes("s")) newHeight = Math.max(30, dragStart.startY + dy);
        if (activeHandle.includes("n")) newHeight = Math.max(30, dragStart.startY - dy);

        // Maintain aspect ratio using the axis with the largest delta
        // (prevents diagonal handles from ignoring the secondary axis)
        if (Math.abs(dx) >= Math.abs(dy)) {
          newHeight = newWidth / aspectRatio;
        } else {
          newWidth = newHeight * aspectRatio;
        }

        // Clamp to container
        newWidth = Math.min(newWidth, containerSize.width - overlayPosition.x);
        newHeight = Math.min(newHeight, containerSize.height - overlayPosition.y);

        setOverlaySize({ width: newWidth, height: newHeight });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(false);
      setActiveHandle(null);
      setDragStart(null);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, isResizing, dragStart, activeHandle, containerSize, overlaySize, overlayPosition, selectedSignature]);

  // Apply signature to PDF
  const handleApplySignature = useCallback(async () => {
    if (!pdfFile || !selectedSignature) {
      sileo.error({
        title: "Cannot apply signature",
        description: !pdfFile 
          ? "Please upload a PDF first" 
          : "Please select a signature first",
        roundness: 16,
        duration: 3000,
      });
      return;
    }

    // PREFERRED PATH: compute PDF coords from known values (overlay position,
    // container size, zoom, scroll, and actual page dimensions from pdf-lib).
    // This completely bypasses the need to find DOM elements inside embedpdf.
    let precomputedPdfCoords: PrecomputedPdfCoords | undefined;

    // Also need fallback params
    let actualScale: number | undefined;
    let scrollLeft = scrollRef.current.x;
    let scrollTop = scrollRef.current.y;
    let viewportClientWidth: number | undefined;
    let viewportClientHeight: number | undefined;

    const overlayEl = overlayRef.current;
    const overlayImgEl = overlayImgRef.current;

    // --- MATH APPROACH: compute page position from zoom + container + scroll ---
    // The overlay is position:absolute within containerRef, with (left, top) =
    // (overlayPosition.x, overlayPosition.y).
    // The page is rendered inside PDFViewer (same container), at:
    //   pageX = pageOffsetX - scrollLeft
    //   pageY = pageOffsetY - scrollTop
    // where pageOffset centers the page in the container at scroll=0.
    //
    // We compute pageDisplaySize from actual page dimensions × zoom,
    // then derive the fractions directly — no DOM querying needed.
    {
      // Get the actual zoom level: prefer ZoomPlugin (live), fall back to React state
      let effectiveScale = zoom;
      const registry = registryRef.current;
      if (registry) {
        try {
          const zoomPlugin = registry.getPlugin<ZoomPlugin>("zoom");
          const zoomState = zoomPlugin?.provides()?.getState();
          if (zoomState && zoomState.currentZoomLevel > 0) {
            effectiveScale = zoomState.currentZoomLevel;
          }
        } catch {
          // use zoom from React state
        }
      }

      // Get the ACTUAL page size from the PDF (not from React state which is
      // always the default 612×792 because onPageChange is never called by PdfViewerWrapper)
      let actualPageW = pageSize.width;
      let actualPageH = pageSize.height;
      if (pdfFile) {
        try {
          const actualSize = await getPdfPageSize(pdfFile, currentPage + 1);
          actualPageW = actualSize.width;
          actualPageH = actualSize.height;
        } catch {
          // fall back to React state
        }
      }

      // Page display dimensions in CSS pixels at the current zoom
      const pageDisplayW = actualPageW * effectiveScale;
      const pageDisplayH = actualPageH * effectiveScale;

      // Get actual viewport dimensions from embedpdf (excludes internal toolbar).
      // The page is centered within the scrollable viewport area, NOT the full container.
      // The overlay is positioned relative to the full container, so we must account
      // for the toolbar offset between container and viewport.
      let viewportContentW = containerSize.width;
      let viewportContentH = containerSize.height;
      if (registry) {
        try {
          const vpPlugin = registry.getPlugin<ViewportPlugin>("viewport");
          const metrics = vpPlugin?.provides()?.getMetrics();
          if (metrics?.clientHeight && metrics.clientHeight > 0) {
            viewportContentH = metrics.clientHeight;
          }
          if (metrics?.clientWidth && metrics.clientWidth > 0) {
            viewportContentW = metrics.clientWidth;
          }
        } catch {
          // fallback to containerSize
        }
      }

      // Toolbar offset = difference between full container and scrollable viewport area
      const toolbarOffsetY = containerSize.height - viewportContentH;
      const toolbarOffsetX = containerSize.width - viewportContentW;

      // Page offset = toolbar offset + centering within the viewport area
      const pageOffsetX = toolbarOffsetX + Math.max(0, (viewportContentW - pageDisplayW) / 2);
      const pageOffsetY = toolbarOffsetY + Math.max(0, (viewportContentH - pageDisplayH) / 2);

      // Overlay position RELATIVE to the page's top-left corner
      const relX = overlayPosition.x + scrollLeft - pageOffsetX;
      const relY = overlayPosition.y + scrollTop - pageOffsetY;

      // Signature image excludes the 2px border on each side
      const sigImgW = overlaySize.width - 4;
      const sigImgH = overlaySize.height - 4;

      // Fractions of the page
      precomputedPdfCoords = {
        fractionX: relX / pageDisplayW,
        fractionY: relY / pageDisplayH,
        fractionWidth: sigImgW / pageDisplayW,
        fractionHeight: sigImgH / pageDisplayH,
      };

      actualScale = effectiveScale;
    }

    // Keep registry-based info for context (not used when precomputedPdfCoords is set)
    try {
      const registry = registryRef.current;
      if (registry) {
        const viewportPlugin = registry.getPlugin<ViewportPlugin>("viewport");
        if (viewportPlugin) {
          const metrics = viewportPlugin.provides()?.getMetrics();
          if (metrics) {
            viewportClientWidth = metrics.clientWidth;
            viewportClientHeight = metrics.clientHeight;
          }
        }
      }
    } catch {
      // non-critical
    }

    const blob = await sign({
      pdfSource: pdfFile,
      signatureDataUrl: selectedSignature.dataUrl,
      targetPage: currentPage + 1,
      position: overlayPosition,
      size: overlaySize,
      containerSize,
      pageSize,
      zoom,
      actualScale,
      scrollLeft,
      scrollTop,
      viewportClientWidth,
      viewportClientHeight,
      precomputedPdfCoords,
    });

    if (blob) {
      const url = URL.createObjectURL(blob);
      const timestamp = new Date().toISOString().slice(0, 10);
      const filename = `signed-${timestamp}.pdf`;

      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      sileo.success({
        title: "PDF signed!",
        description: "Your signed PDF has been downloaded",
        roundness: 16,
        duration: 3000,
      });
    }
  }, [pdfFile, selectedSignature, currentPage, overlayPosition, overlaySize, containerSize, pageSize, zoom, sign]);

  const isSigning = status === "loading" || status === "signing";

  return (
    <div className={cn("flex flex-1 min-h-0 gap-4 px-6 pb-4", className)}>
      {/* Sidebar - Signature Picker */}
      <div className="w-80 flex-shrink-0 border-r pr-4 overflow-y-auto bg-card/50 rounded-lg p-4">
        <SignaturePicker
          signatures={signatures}
          selectedSignature={selectedSignature}
          isLoading={isLoading}
          onSelect={handleSignatureSelect}
          onDelete={handleSignatureDelete}
          onSave={handleSignatureSave}
        />
        
        {selectedSignature && (
          <div className="mt-4 p-3 bg-primary/5 rounded-lg border border-primary/20">
            <p className="text-xs text-muted-foreground">
              <strong className="text-foreground">Tip:</strong> Drag the signature to position it. Use the corner handles to resize.
            </p>
          </div>
        )}
      </div>

      {/* Main area - PDF Viewer + Overlay */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Toolbar */}
        <div className="flex items-center gap-3 mb-3 pb-3 border-b flex-shrink-0">
          <div className="flex items-center gap-2">
            <Input
              type="file"
              accept=".pdf,application/pdf"
              onChange={handleFileSelect}
              className="hidden"
              id="pdf-upload"
            />
            <label htmlFor="pdf-upload">
              <Button variant="outline" size="sm" asChild>
                <span className="cursor-pointer">
                  <Upload className="h-4 w-4 mr-2" />
                  Upload PDF
                </span>
              </Button>
            </label>
          </div>

          <div className="text-sm text-muted-foreground">
            {pdfFile ? (
              <span>Page {currentPage + 1} of {totalPages || "?"}</span>
            ) : (
              <span>No PDF</span>
            )}
          </div>

          <div className="text-sm text-muted-foreground">
            {Math.round(zoom * 100)}%
          </div>

          <div className="ml-auto flex items-center gap-2">
            {pdfFile && selectedSignature && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedSignature(null)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Clear
              </Button>
            )}
            <Button
              size="sm"
              onClick={handleApplySignature}
              disabled={!pdfFile || !selectedSignature || isSigning}
            >
              {isSigning ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Signing...
                </>
              ) : (
                <>
                  <FileSignature className="h-4 w-4 mr-2" />
                  Apply & Download
                </>
              )}
            </Button>
          </div>
        </div>

        {/* PDF Viewer Container with Overlay */}
        <div
          ref={viewerContainerRef}
          className="flex-1 relative border rounded-lg overflow-hidden bg-muted/30"
        >
          {pdfFile ? (
            <>
              <PdfViewerWrapper
                file={pdfFile}
                initialPage={currentPage}
                initialZoom={zoom}
                onPageChange={handlePageChange}
                onZoomChange={handleZoomChange}
                onReady={handleRegistryReady}
                overlay={
                  selectedSignature ? (
                    <div
                      ref={overlayRef}
                      className="absolute select-none"
                      style={{
                        left: overlayPosition.x,
                        top: overlayPosition.y,
                        width: overlaySize.width,
                        height: overlaySize.height,
                        cursor: isDragging ? "grabbing" : "grab",
                        zIndex: 9999,
                      }}
                      onMouseDown={handleMouseDown}
                    >
                      <div className="relative w-full h-full border-2 border-dashed border-blue-500 rounded shadow-lg">
                        <img
                          ref={overlayImgRef}
                          src={selectedSignature.dataUrl}
                          alt={selectedSignature.name}
                          className="w-full h-full object-contain pointer-events-none"
                          draggable={false}
                        />
                        
                        {/* Resize handles */}
                        {["nw", "ne", "sw", "se"].map((handle) => (
                          <div
                            key={handle}
                            className={cn(
                              "absolute w-3 h-3 bg-white border-2 border-blue-500 rounded-sm cursor-pointer hover:bg-blue-100",
                              handle === "nw" && "-top-1.5 -left-1.5 cursor-nwse-resize",
                              handle === "ne" && "-top-1.5 -right-1.5 cursor-nesw-resize",
                              handle === "sw" && "-bottom-1.5 -left-1.5 cursor-nesw-resize",
                              handle === "se" && "-bottom-1.5 -right-1.5 cursor-nwse-resize",
                            )}
                            onMouseDown={(e) => handleResizeMouseDown(e, handle)}
                          />
                        ))}
                      </div>
                    </div>
                  ) : undefined
                }
              />
            </>
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              <div className="text-center">
                <Upload className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">Upload a PDF to sign</p>
                <p className="text-sm mt-1">Select a PDF file from your computer</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
