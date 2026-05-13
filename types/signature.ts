/**
 * Shared type definitions for visual PDF signature system.
 */

export interface StoredSignature {
  /** UUID v4 identifier */
  id: string;
  /** User-defined label */
  name: string;
  /** PNG base64 data URL */
  dataUrl: string;
  /** Unix timestamp in milliseconds */
  createdAt: number;
  /** Canvas width in pixels */
  width: number;
  /** Canvas height in pixels */
  height: number;
}

/** Position relative to PDF container */
export interface SignaturePosition {
  /** Pixels from container left edge */
  x: number;
  /** Pixels from container top edge */
  y: number;
}

/** Size in pixels */
export interface SignatureSize {
  /** Width in pixels */
  width: number;
  /** Height in pixels */
  height: number;
}

/** Combined position and size */
export interface SignatureRect extends SignaturePosition, SignatureSize {}

/** Parameters for signing a PDF */
export interface SignPdfParams {
  /** Source PDF file */
  pdfSource: File | Blob | ArrayBuffer;
  /** Signature image as data URL */
  signatureDataUrl: string;
  /** Target page number (1-indexed) */
  targetPage: number;
  /** DOM position relative to container */
  position: SignaturePosition;
  /** DOM size of signature */
  size: SignatureSize;
  /** Container dimensions */
  containerSize: { width: number; height: number };
  /** PDF page dimensions in points */
  pageSize: { width: number; height: number };
  /** Current zoom level (1.0 = 100%) — for backward compatibility */
  zoom: number;
  /** Actual render scale from embedpdf zoom plugin's getState().currentZoomLevel (optional — falls back to zoom) */
  actualScale?: number;
  /** Horizontal scroll position of the viewer viewport (optional — defaults to 0) */
  scrollLeft?: number;
  /** Vertical scroll position of the viewer viewport (optional — defaults to 0) */
  scrollTop?: number;
  /** Page's X offset within the scroller e.g. (clientWidth - pageWidth * scale) / 2 (optional — defaults to 0) */
  pageOffsetX?: number;
  /** Page's Y offset within the scroller (optional — defaults to 0) */
  pageOffsetY?: number;
}

/** Result from signing operation */
export interface SignPdfResult {
  /** Signed PDF as blob */
  blob: Blob;
  /** Suggested filename */
  filename: string;
}

/** Status of the signing operation */
export type SigningStatus = "idle" | "loading" | "signing" | "done" | "error";

/** Drag or resize handle position */
export type ResizeHandle = "nw" | "ne" | "sw" | "se";

/** Mode for creating a new signature */
export type SignatureMode = "draw" | "text";
