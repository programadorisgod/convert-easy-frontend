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
 * Uses proportional container-to-page scaling adjusted for the actual
 * render scale from embedpdf's zoom level.
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
  actualScale?: number;
  scrollLeft?: number;
  scrollTop?: number;
  pageOffsetX?: number;
  pageOffsetY?: number;
}): { pdfX: number; pdfY: number; pdfWidth: number; pdfHeight: number } {
  const {
    domX, domY, sigWidth, sigHeight,
    pageWidth, pageHeight,
    containerWidth, containerHeight,
    zoom,
    actualScale: providedScale,
    scrollLeft = 0,
    scrollTop = 0,
    pageOffsetX = 0,
    pageOffsetY = 0,
  } = params;

  // If actual render metrics are available (from embedpdf registry), use them
  if (providedScale && providedScale > 0) {
    const pdfX = (domX + scrollLeft - pageOffsetX) / providedScale;
    const pdfYFromTop = (domY + scrollTop - pageOffsetY) / providedScale;
    const pdfY = pageHeight - pdfYFromTop - (sigHeight / providedScale);
    const pdfWidth = sigWidth / providedScale;
    const pdfHeight = sigHeight / providedScale;
    return { pdfX, pdfY, pdfWidth, pdfHeight };
  }

  // Fallback: proportional container-to-page scaling (legacy behavior)
  const scaleX = pageWidth / containerWidth;
  const scaleY = pageHeight / containerHeight;
  const normalizedZoom = zoom || 1;

  const pdfX = (domX / normalizedZoom) * scaleX;
  const pageScaledHeight = (domY / normalizedZoom) * scaleY;
  const pdfY = pageHeight - pageScaledHeight - (sigHeight / normalizedZoom) * scaleY;
  const pdfWidth = (sigWidth / normalizedZoom) * scaleX;
  const pdfHeight = (sigHeight / normalizedZoom) * scaleY;

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
  // If pageSize wasn't provided, try to get from PDF
  let actualPageWidth = pageSize.width;
  let actualPageHeight = pageSize.height;

  if (!actualPageWidth || !actualPageHeight) {
    const page = pdfDoc.getPage(targetPage - 1); // pdf-lib uses 0-index
    const { width, height } = page.getSize();
    actualPageWidth = width;
    actualPageHeight = height;
  }

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
  });

  // Load and embed the signature image
  // Extract base64 data (remove data:image/png;base64, prefix if present)
  const base64Data = signatureDataUrl.replace(/^data:image\/\w+;base64,/, "");
  const imageBytes = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));

  // Embed as PNG
  const image = await pdfDoc.embedPng(imageBytes);

  // Get the target page and embed the image
  const page = pdfDoc.getPage(targetPage - 1);
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
