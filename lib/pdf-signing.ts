/**
 * PDF signing functionality using pdf-lib.
 * Handles coordinate translation from DOM to PDF space and embeds signature images.
 */

import { PDFDocument, rgb } from "pdf-lib";
import type {
  SignPdfParams,
  SignPdfResult,
  SignaturePosition,
  SignatureSize,
} from "@/types/signature";

/**
 * Convert DOM coordinates to PDF coordinates.
 *
 * Uses actual render metrics from embedpdf when available (via `actualScale`,
 * `scrollLeft`, `scrollTop`, `viewportClientWidth`, `viewportClientHeight`).
 *
 * The overlay is `position: absolute` relative to the outer container and does
 * NOT scroll with the PDF content. To map overlay coords to the scrolled page,
 * we add scrollLeft/scrollTop (the page content has shifted, the overlay
 * hasn't), then subtract the page centering offset.
 *
 * CRITICAL: pageOffsetX/Y is computed INTERNALLY using the actual pageWidth/
 * pageHeight passed here, NOT from React state, avoiding stale-state bugs.
 */
function domToPdfCoords(params: {
  domX: number;
  domY: number;
  sigWidth: number;
  sigHeight: number;
  pageWidth: number;
  pageHeight: number;
  containerWidth: number;
  containerHeight: number;
  zoom: number;
  /** Actual render scale from embedpdf ZoomPlugin (e.g. 0.75 for fit-width) */
  actualScale?: number;
  /** Horizontal scroll of the embedpdf viewport */
  scrollLeft?: number;
  /** Vertical scroll of the embedpdf viewport */
  scrollTop?: number;
  /** Pre-computed page offset X (deprecated — computed from viewportClientWidth when available) */
  pageOffsetX?: number;
  /** Pre-computed page offset Y (deprecated — computed from viewportClientHeight when available) */
  pageOffsetY?: number;
  /** Viewport clientWidth from embedpdf ViewportMetrics (used to compute pageOffset internally) */
  viewportClientWidth?: number;
  /** Viewport clientHeight from embedpdf ViewportMetrics (used to compute pageOffset internally) */
  viewportClientHeight?: number;
}): { pdfX: number; pdfY: number; pdfWidth: number; pdfHeight: number } {
  const {
    domX, domY, sigWidth, sigHeight,
    pageWidth, pageHeight,
    containerWidth, containerHeight,
    zoom,
    actualScale: providedScale,
    scrollLeft = 0,
    scrollTop = 0,
    pageOffsetX: precomputedOffsetX,
    pageOffsetY: precomputedOffsetY,
    viewportClientWidth,
    viewportClientHeight,
  } = params;

  // If actual render metrics are available (from embedpdf registry), use them
  if (providedScale && providedScale > 0) {
    // Compute page centering offset INTERNALLY using actual page dimensions.
    // This is the definitive fix for stale pageSize in React state.
    const pageOffsetX = viewportClientWidth != null && viewportClientWidth > 0
      ? Math.max(0, (viewportClientWidth - pageWidth * providedScale) / 2)
      : (precomputedOffsetX ?? 0);
    const pageOffsetY = viewportClientHeight != null && viewportClientHeight > 0
      ? Math.max(0, (viewportClientHeight - pageHeight * providedScale) / 2)
      : (precomputedOffsetY ?? 0);

    const relX = domX + scrollLeft - pageOffsetX;
    const relY = domY + scrollTop - pageOffsetY;
    const pdfX = relX / providedScale;
    const pdfYFromTop = relY / providedScale;
    const pdfY = pageHeight - pdfYFromTop - (sigHeight / providedScale);
    const pdfWidth = sigWidth / providedScale;
    const pdfHeight = sigHeight / providedScale;
    return { pdfX, pdfY, pdfWidth, pdfHeight };
  }

  // Fallback: proportional container-to-page scaling (legacy behavior)
  // NOTE: This path does NOT account for scroll — it's a best-effort for when
  // the embedpdf registry is unavailable. Always prefer the accurate path.
  const scaleX = pageWidth / containerWidth;
  const scaleY = pageHeight / containerHeight;

  const normalizedX = domX / zoom;
  const normalizedY = domY / zoom;

  const pdfX = normalizedX * scaleX;
  const pageScaledHeight = normalizedY * scaleY;
  const pdfY = pageHeight - pageScaledHeight - sigHeight * scaleY;
  const pdfWidth = (sigWidth / zoom) * scaleX;
  const pdfHeight = (sigHeight / zoom) * scaleY;

  return { pdfX, pdfY, pdfWidth, pdfHeight };
}

/**
 * Sign a PDF by embedding a signature image at the specified position.
 * @param params - Signing parameters
 * @returns Signed PDF blob and suggested filename
 */
export async function signPdf(params: SignPdfParams): Promise<SignPdfResult> {
  const {
    pdfSource,
    signatureDataUrl,
    targetPage,
    position,
    size,
    containerSize,
    pageSize,
    zoom,
    actualScale,
    scrollLeft,
    scrollTop,
    pageOffsetX,
    pageOffsetY,
    viewportClientWidth,
    viewportClientHeight,
  } = params;

  // Load the source PDF
  let pdfBytes: ArrayBuffer;
  if (pdfSource instanceof File) {
    pdfBytes = await pdfSource.arrayBuffer();
  } else if (pdfSource instanceof Blob) {
    pdfBytes = await pdfSource.arrayBuffer();
  } else {
    pdfBytes = pdfSource;
  }

  const pdfDoc = await PDFDocument.load(pdfBytes);

  // Get page dimensions for coordinate translation
  // ALWAYS prefer the actual page size from pdf-lib over the passed pageSize,
  // because pageSize comes from React state which may be stale (default 612x792)
  // or incorrect if getPdfPageSize hasn't resolved yet.
  const page = pdfDoc.getPage(targetPage - 1); // pdf-lib uses 0-index
  const { width: pdfPageWidth, height: pdfPageHeight } = page.getSize();
  const actualPageWidth = pdfPageWidth;
  const actualPageHeight = pdfPageHeight;

  // Translate DOM coords to PDF coords
  const { pdfX, pdfY, pdfWidth, pdfHeight } = domToPdfCoords({
    domX: position.x,
    domY: position.y,
    sigWidth: size.width,
    sigHeight: size.height,
    pageWidth: actualPageWidth,
    pageHeight: actualPageHeight,
    containerWidth: containerSize.width,
    containerHeight: containerSize.height,
    zoom,
    actualScale,
    scrollLeft,
    scrollTop,
    pageOffsetX,
    pageOffsetY,
    viewportClientWidth,
    viewportClientHeight,
  });

  // Load and embed the signature image
  // Extract base64 data (remove data:image/png;base64, prefix if present)
  const base64Data = signatureDataUrl.replace(/^data:image\/\w+;base64,/, "");
  const imageBytes = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));

  // Embed as PNG
  const image = await pdfDoc.embedPng(imageBytes);

  // Get the target page and embed the image
  // (page is already fetched above for size, reuse it)
  page.drawImage(image, {
    x: pdfX,
    y: pdfY,
    width: pdfWidth,
    height: pdfHeight,
  });

  // Save and return as blob
  const signedPdfBytes = await pdfDoc.save();
  const blob = new Blob([signedPdfBytes], { type: "application/pdf" });

  // Generate filename
  const timestamp = new Date().toISOString().slice(0, 10);
  const filename = `signed-${timestamp}.pdf`;

  return { blob, filename };
}

/**
 * Get PDF page dimensions.
 * @param pdfSource - Source PDF file/blob/arraybuffer
 * @param pageNumber - Page number (1-indexed)
 * @returns Page width and height in points
 */
export async function getPdfPageSize(
  pdfSource: File | Blob | ArrayBuffer,
  pageNumber: number,
): Promise<{ width: number; height: number }> {
  let pdfBytes: ArrayBuffer;
  if (pdfSource instanceof File) {
    pdfBytes = await pdfSource.arrayBuffer();
  } else if (pdfSource instanceof Blob) {
    pdfBytes = await pdfSource.arrayBuffer();
  } else {
    pdfBytes = pdfSource;
  }

  const pdfDoc = await PDFDocument.load(pdfBytes);
  const page = pdfDoc.getPage(pageNumber - 1);
  const { width, height } = page.getSize();

  return { width, height };
}

/**
 * Get total number of pages in a PDF.
 */
export async function getPdfPageCount(
  pdfSource: File | Blob | ArrayBuffer,
): Promise<number> {
  let pdfBytes: ArrayBuffer;
  if (pdfSource instanceof File) {
    pdfBytes = await pdfSource.arrayBuffer();
  } else if (pdfSource instanceof Blob) {
    pdfBytes = await pdfSource.arrayBuffer();
  } else {
    pdfBytes = pdfSource;
  }

  const pdfDoc = await PDFDocument.load(pdfBytes);
  return pdfDoc.getPageCount();
}
