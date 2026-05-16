# pdf-sign-viewport-fix

Full viewport layout + accurate DOM-to-PDF coordinate translation for the PDF signing page.

**Capabilities**: 3

---

## Capability: pdf-sign-layout

### Purpose

The `/tools/pdf-sign` page currently wraps its content inside `container mx-auto px-4 pt-4`, which constrains the PDF viewer to a centered, padded box. Combined with `PdfSignPage`'s `h-[calc(100vh-12rem)]`, the viewer area doesn't fill available vertical space, causing overflow and making it impossible to see the full PDF document. This capability restructures the layout to use the full viewport.

### Requirements

1. The `tool-page.tsx` SHALL detect `config.type === "sign"` and render a full-viewport layout instead of the constrained container layout.
2. The top-level wrapper for the sign type SHALL use `flex flex-col h-screen` with no horizontal padding.
3. The header section (icon, label, description) SHALL use `flex-shrink-0` so it takes only its natural height.
4. The `PdfSignPage` component and its parent wrapper SHALL use `flex-1 min-h-0` so it fills remaining space without overflowing.
5. The toolbar inside `PdfSignPage` SHALL be `flex-shrink-0` so scrolling only affects the viewer area.
6. `PdfSignPage` SHALL change its root container from `h-[calc(100vh-12rem)]` to `flex-1 min-h-0`.
7. The sidebar (SignaturePicker) SHALL remain `flex-shrink-0` with a fixed width.
8. The viewer container (with `ref={viewerContainerRef}`) SHALL remain `flex-1 relative overflow-hidden` for the overlay + PDF viewer.

### Scenarios

**SC-1: Page loads sign tool**
1. User navigates to `/tools/pdf-sign`.
2. The page renders `flex flex-col h-screen` with no container padding.
3. Header shows icon + label + description at top (`flex-shrink-0`).
4. Below header, the main area (`flex-1 min-h-0`) contains sidebar + viewer + toolbar.
5. The PDF viewer fills all remaining vertical space.
6. No overflow or scrollbar on the page-level container.

**SC-2: User uploads a multi-page PDF**
1. User clicks "Upload PDF".
2. PdfSignPage renders the viewer in the flex-1 area.
3. User can scroll within the viewer to see the full document.
4. The toolbar and sidebar remain visible (no scroll on the outer layout).
5. The viewer takes `flex-1` — it grows/shrinks with viewport resize.

### Implementation Notes

**tool-page.tsx changes (lines 463-482):**
```tsx
// Replace the wrapping div for sign type:
// FROM:
<div className="container mx-auto px-4 pt-4">
  <div className="mb-6">...</div>
  <PdfSignPage initialFile={file?.file || null} />
</div>

// TO:
<div className="flex flex-col h-screen">
  <div className="flex-shrink-0 px-4 pt-4">
    <div className="mb-6">...</div>  {/* header: icon, label, description */}
  </div>
  <PdfSignPage
    initialFile={file?.file || null}
    className="flex-1 min-h-0"
  />
</div>
```

**tool-page.tsx outer wrapper (lines 505-511):**
Remove the wrapping `min-h-screen bg-background` div for sign type, since `h-screen` is now at the content level. The sign-type return should just render the flex layout directly:
```tsx
if (config.type === "sign") {
  return (
    <div className="bg-background">
      {renderContent()}
    </div>
  );
}
```

Wait — actually `renderContent()` already returns the sign layout. The outer `<div className="min-h-screen bg-background">` is redundant for sign. Keep a minimal wrapper:
```tsx
if (config.type === "sign") {
  return <div className="bg-background">{renderContent()}</div>;
}
```

**PdfSignPage changes (line 289):**
```tsx
// FROM:
<div className={cn("flex h-[calc(100vh-12rem)] gap-4 pt-4 px-4 pb-4", className)}>

// TO:
// The component receives flex-1 min-h-0 from parent via className
// Sidebar stays flex-shrink-0 w-80
// The right column (toolbar + viewer) uses flex-1 min-h-0 flex flex-col
// The viewer container uses flex-1 relative overflow-hidden
```

Restructure the return JSX so:
- Root receives `className` (now includes `flex-1 min-h-0`)
- Root uses `flex gap-4` (horizontal layout: sidebar + main area)
- Sidebar: `w-80 flex-shrink-0`
- Main area: `flex-1 min-h-0 flex flex-col`
- Toolbar: `flex-shrink-0`
- Viewer: `flex-1 relative overflow-hidden`

**Viewer container ref for overlay**:
The `viewerContainerRef` stays on the viewer div (`flex-1 relative overflow-hidden border rounded-lg`). The `ResizeObserver` on this ref tracks the actual available viewer area, which is correct for overlay boundary constraints.

---

## Capability: pdf-viewer-registry

### Purpose

`PdfViewerWrapper` currently wraps `@embedpdf/react-pdf-viewer`'s `PDFViewer` component but does not expose the `PluginRegistry` that the viewer provides via its `onReady` callback. Without the registry, components like `PdfSignPage` cannot access embedpdf capabilities (`ZoomCapability`, `ViewportCapability`) needed for accurate coordinate translation. This capability threads the registry from the viewer through the wrapper to consumers.

### Requirements

1. `PdfViewerWrapper` SHALL accept an optional `onReady` prop matching `PDFViewerProps['onReady']` signature: `(registry: PluginRegistry) => void`.
2. `PdfViewerWrapper` SHALL pass the `onReady` prop directly through to the underlying `PDFViewer` component.
3. `PdfViewerWrapper` SHALL expose the `PDFViewerRef` so callers can access the `registry` Promise via a ref.
4. `PdfSignPage` SHALL accept an optional `onRegistryReady` prop of type `(registry: PluginRegistry) => void`.
5. `tool-page.tsx` SHALL wire `onRegistryReady` from `PdfSignPage` if needed, or `PdfSignPage` SHALL manage registry acquisition internally.
6. `PdfSignPage` SHALL store the registry reference in a `useRef` (not state) when `onReady` fires, since the registry is stable after initialization.
7. The `PluginRegistry` type SHALL be imported via `import type { PluginRegistry } from "@embedpdf/core"`.
8. The zoom and viewport plugin IDs SHALL be accessed via the string literals `"zoom"` and `"viewport"` (the static `Plugin.id` fields are framework-specific).

### Scenarios

**SC-1: PdfSignPage receives registry via prop**
1. `tool-page.tsx` renders `<PdfSignPage>` without passing `onRegistryReady`.
2. Inside `PdfSignPage`, the JSX passes `onReady={handleRegistryReady}` to `<PdfViewerWrapper>`.
3. `PdfViewerWrapper` forwards `onReady` to `<PDFViewer onReady={onReady} ... />`.
4. When embedpdf initializes, `onReady` fires with the `PluginRegistry` instance.
5. `PdfSignPage` stores the registry in `registryRef = useRef<PluginRegistry | null>(null)`.
6. Subsequent zoom/scroll operations access `registryRef.current` to get capabilities.

**SC-2: Registry accessed after viewer mount**
1. User uploads a PDF, viewer mounts and calls `onReady`.
2. User drags the signature overlay.
3. On "Apply & Download", the signing logic reads `registryRef.current`.
4. Gets `ZoomPlugin` and `ViewportPlugin` from the registry.
5. Reads actual zoom level and viewport metrics for coordinate translation.

### Implementation Notes

**PdfViewerWrapper changes:**
Add `onReady` prop to the interface:
```tsx
export interface PdfViewerWrapperProps {
  // ... existing props
  /** Callback when the plugin registry is ready */
  onReady?: (registry: PluginRegistry) => void;
}
```

Forward it to `PDFViewer`:
```tsx
<PDFViewer
  ref={viewerRef}
  config={viewerConfig}
  className="w-full h-full"
  onInit={handleInit}
  onReady={onReady}
/>
```

**PdfSignPage changes:**
Add registry ref and handler:
```tsx
// At component top level:
import type { PluginRegistry } from "@embedpdf/core";

// Inside component body:
const registryRef = useRef<PluginRegistry | null>(null);
const handleRegistryReady = useCallback((registry: PluginRegistry) => {
  registryRef.current = registry;
}, []);
```

Pass to wrapper:
```tsx
<PdfViewerWrapper
  file={pdfFile}
  initialPage={currentPage}
  initialZoom={zoom}
  onPageChange={handlePageChange}
  onZoomChange={handleZoomChange}
  onReady={handleRegistryReady}
/>
```

**import path**: `import type { PluginRegistry } from "@embedpdf/core"` resolves correctly since `@embedpdf/react-pdf-viewer` re-exports from `@embedpdf/snippet` which types `PluginRegistry` from `@embedpdf/core`.

**Note**: The `onReady` callback fires ONCE when the viewer fully initializes. The registry is stable after that. No cleanup needed.

---

## Resolution: Final Coordinate Translation Strategy

The coordinate translation went through multiple iterations before reaching the correct solution. Below is the definitive approach that works.

### The Final Approach: Math-Based with Viewport Metrics

The overlay is `position:absolute` within `viewerContainerRef` (the outer container div). The PDF page is rendered inside embedpdf's Shadow DOM, centered within the **scrollable viewport area** (NOT the full container). The key insight: embedpdf has an internal toolbar that shifts the scrollable viewport down relative to the container.

**Coordinate chain:**

```
container (overlay positioned here)
  ├─ embedpdf toolbar (internal, height = toolbarOffsetY)
  └─ scrollable viewport (clientWidth × clientHeight from ViewportPlugin)
      └─ page (centered within viewport at current zoom)
```

**Formula:**

```typescript
// 1. Get actual zoom from ZoomPlugin (live value, not React state)
effectiveScale = ZoomPlugin.getState().currentZoomLevel

// 2. Get actual page size from pdf-lib (not React state which is stale)
actualPageW, actualPageH = getPdfPageSize(pdfFile, currentPage)

// 3. Get viewport dimensions from ViewportPlugin (excludes toolbar)
viewportContentW = ViewportPlugin.getMetrics().clientWidth
viewportContentH = ViewportPlugin.getMetrics().clientHeight
// Fallback: use containerSize if metrics unavailable

// 4. Compute toolbar offset (difference between container and viewport)
toolbarOffsetY = containerSize.height - viewportContentH
toolbarOffsetX = containerSize.width - viewportContentW

// 5. Page display size at current zoom
pageDisplayW = actualPageW * effectiveScale
pageDisplayH = actualPageH * effectiveScale

// 6. Page offset = toolbar offset + centering within viewport
pageOffsetX = toolbarOffsetX + max(0, (viewportContentW - pageDisplayW) / 2)
pageOffsetY = toolbarOffsetY + max(0, (viewportContentH - pageDisplayH) / 2)

// 7. Position relative to page top-left
relX = overlayPosition.x + scrollLeft - pageOffsetX
relY = overlayPosition.y + scrollTop - pageOffsetY

// 8. Convert to fractions (0-1 range)
fractionX = relX / pageDisplayW
fractionY = relY / pageDisplayH
fractionWidth = (overlaySize.width - 4) / pageDisplayW   // -4 for 2px border each side
fractionHeight = (overlaySize.height - 4) / pageDisplayH

// 9. In signPdf(), convert fractions to PDF points
pdfX = fractionX * actualPageWidth
pdfY = (1 - fractionY - fractionHeight) * actualPageHeight
pdfWidth = fractionWidth * actualPageWidth
pdfHeight = fractionHeight * actualPageHeight
```

### Bugs Fixed Through Iteration

| Iteration | Bug | Root Cause | Fix |
|-----------|-----|------------|-----|
| #1 | Signature completely wrong position | `domToPdfCoords` used `containerWidth/pageWidth` scaling, ignored scroll and centering | Added `renderScale`, `scrollOffset`, `clientWidth/Height` from embedpdf plugins |
| #2 | Signature disappeared in exported PDF | `domToPdfCoords` new path activated when viewport metrics were still zeros (default) | Guarded metrics validation; added `actualScale` check |
| #3 | Signature offset on long PDFs / non-Letter sizes | `scrollTop` was added to formula when overlay doesn't scroll with embedpdf content | Removed scroll from new path; added scroll back when overlay IS relative to scrolled container |
| #4 | Signature still offset by ~10px | Assumed page centered in full container, but embedpdf has `viewportGap` (10px padding) | Tried using `viewportGap` — this was INCORRECT (see #5) |
| #5 | Signature offset WORSENED | Tried DOM-based `getBoundingClientRect` to find page element, but embedpdf uses Shadow DOM — selectors never matched | Reverted to math-based approach |
| #6 (FINAL) | Small residual offset (~10-20px) | Page is centered within **scrollable viewport**, NOT full container. embedpdf has internal toolbar that shifts viewport down | Use `ViewportPlugin.getMetrics().clientWidth/clientHeight` to get viewport area, compute toolbar offset, then center within viewport |

### Key Learnings

1. **Shadow DOM**: embedpdf renders inside a web component's Shadow Root. No `querySelector` from light DOM can access internal elements. DOM-based approaches are impossible.

2. **Stale React state**: `pageSize` in React state is always the default (612×792) because `onPageChange` is never called by `PdfViewerWrapper`. Always read actual page size from pdf-lib at signing time.

3. **Zoom state sync**: React `zoom` state may diverge from embedpdf's actual zoom. Subscribe to `ZoomPlugin.onZoomChange` to keep in sync, or read `getState().currentZoomLevel` at signing time.

4. **Toolbar offset**: The difference between `containerSize` and `ViewportPlugin.getMetrics().clientWidth/clientHeight` is the embedpdf internal toolbar height. This must be added to the page offset calculation.

5. **Page centering**: The page IS centered, but within the scrollable viewport area (after toolbar offset), not the full container.

6. **2px border**: The overlay has a 2px dashed border on all sides. The signature image inside excludes this border, so subtract 4px (2px each side) from overlay size for accurate signature dimensions.

7. **Fraction-based coords**: Using fractions (0-1 range) decouples coordinate calculation from PDF point conversion. The fractions are computed from DOM measurements, then converted to PDF points using actual page dimensions from pdf-lib — eliminating any dependency on React state during signing.

### Files Modified

| File | Changes |
|------|---------|
| `components/pdf-sign/pdf-sign-page.tsx` | Math-based coordinate computation in `handleApplySignature`; zoom subscription in `handleRegistryReady`; two refs for overlay (div for position, img for size) |
| `lib/pdf-signing.ts` | `PrecomputedPdfCoords` fast path in `signPdf()`; `getPdfPageSize()` function |
| `types/signature.ts` | `PrecomputedPdfCoords` interface; extended `SignPdfParams` |
| `components/pdf-sign/pdf-viewer-wrapper.tsx` | `onReady` prop forwarded to `PDFViewer` |

---

## Capability: pdf-coordinate-translation (Original Spec)

### Purpose

The current `domToPdfCoords` function in `lib/pdf-signing.ts` uses incorrect assumptions to map overlay DOM coordinates to PDF page coordinates:
- It calculates `scaleX/Y` as `pageWidth / containerWidth`, which assumes the page fills the entire container — wrong when zoomed or centered.
- It does not account for scroll position (`scrollLeft`, `scrollTop`).
- It does not account for page centering offset when the rendered page is smaller than the viewport.
- It uses a tracked `zoom` state that may be stale or rounded.

This capability rewrites the coordinate translation to use the actual render scale from the embedpdf `ZoomCapability` and viewport metrics from `ViewportCapability`, producing pixel-perfect signature placement.

### Requirements

1. `SignPdfParams` SHALL be extended with optional `scrollOffset?: { x: number; y: number }` and `renderScale?: number` fields for scroll position and actual render scale.
2. The `signPdf` function SHALL be updated to use `renderScale` and `scrollOffset` when available, falling back to the current zoom-based logic if absent (backward compatibility).
3. `PdfSignPage` SHALL query the plugin registry (from `pdf-viewer-registry`) on "Apply & Download" to get the actual zoom level and viewport metrics.
4. The actual zoom level SHALL come from `ZoomCapability.getState().currentZoomLevel` — this is the definitive render scale.
5. Viewport metrics SHALL come from `ViewportCapability.getMetrics()` — specifically `scrollLeft`, `scrollTop`, `clientWidth`, `clientHeight`.
6. The `domToPdfCoords` function SHALL be rewritten to:
   - Use `renderScale` (actual scale from plugin) instead of `containerWidth/pageWidth` scaling.
   - Calculate page centering offset:
     - `pageOffsetX = Math.max(0, (clientWidth - pageWidth * renderScale) / 2)`
     - `pageOffsetY = Math.max(0, (clientHeight - pageHeight * renderScale) / 2)`
   - Account for scroll position:
     - Convert overlay coords (relative to container) to viewport coords by subtracting scroll.
     - `viewportX = domX - scrollLeft`
     - `viewportY = domY - scrollTop`
   - Subtract centering offset to get position relative to rendered page origin.
   - Convert to PDF points via `renderScale`:
     - `pdfX = (viewportX - pageOffsetX) / renderScale`
     - `pdfY = pageHeight - (viewportY - pageOffsetY + sigHeight / renderScale)` (flip Y, anchor at bottom-left)
     - `pdfWidth = sigWidth / renderScale`
     - `pdfHeight = sigHeight / renderScale`
7. If `scrollOffset` or `renderScale` are not provided, SHALL fall back to the current behavior for backward compatibility.
8. The `SignPdfParams.containerSize` field SHALL remain but will not be used when `renderScale` is available.
9. The `PageSize` type SHALL be updated to use flat fields (project standard: no inline nested objects).

### Scenarios

**SC-1: Signature placed on visible page area (no scroll)**
1. User opens a PDF that fits entirely in the viewport.
2. User drags signature to top-left corner of visible page.
3. `scrollLeft = 0`, `scrollTop = 0`.
4. `renderScale` from `ZoomCapability.getState().currentZoomLevel` = `0.75` (fit-width).
5. `clientWidth = 900`, `clientHeight = 700`.
6. `pageWidth = 612`, `pageHeight = 792`.
7. `pageOffsetX = (900 - 612 * 0.75) / 2 = (900 - 459) / 2 = 220.5`.
8. `pageOffsetY = (700 - 792 * 0.75) / 2 = (700 - 594) / 2 = 53`.
9. Overlay at `{x: 220.5, y: 53}`, size `{width: 150, height: 60}`.
10. `pdfX = (220.5 - 0 - 220.5) / 0.75 = 0`. ✅ Positioned at page left edge.
11. `pdfY = 792 - (53 - 0 - 53 + 60/0.75) / 0.75 = 792 - (60/0.75) / 0.75 = 792 - 80 / 0.75 = ...`

Wait, let me recalculate more carefully:

```
viewportX = domX - scrollLeft = 220.5 - 0 = 220.5
viewportY = domY - scrollTop = 53 - 0 = 53
pageOffsetX = max(0, (900 - 459) / 2) = 220.5
pageOffsetY = max(0, (700 - 594) / 2) = 53
relX = viewportX - pageOffsetX = 220.5 - 220.5 = 0
relY = viewportY - pageOffsetY = 53 - 53 = 0
pdfX = relX / renderScale = 0 / 0.75 = 0
pdfY = pageHeight - (relY + sigHeight) / renderScale
     = 792 - (0 + 60) / 0.75
     = 792 - 80
     = 712
```

Hmm wait: the `sigHeight` in the formula should be the overlay height in DOM pixels. When we divide by renderScale, we get the PDF point height. Let me reconsider.

Actually the formula should be:
```
pdfY = pageHeight - (relY + sigHeight_in_dom) / renderScale
```

This gives us the Y position of the bottom of the signature, since `(relY + sigHeight_in_dom) / renderScale` gives the distance from page top to signature bottom in PDF points. Then `pageHeight - that` gives the distance from page bottom.

Wait, `relY` is the overlay top position relative to page render. `sigHeight` is the overlay height in DOM pixels. So `relY + sigHeight` is the bottom edge of the overlay. `(relY + sigHeight) / renderScale` converts to PDF points. `pageHeight - (relY + sigHeight) / renderScale` gives the PDF Y coordinate (from bottom).

For the signature at top-left, this means the signature's top edge is at PDF Y = 712, which is near the bottom of the page. That's wrong — it should be at the TOP of the page (PDF Y near 792 - height).

Let me re-think. When `relY = 0` (signature at top of rendered page), in PDF coordinates that should be near the bottom of the page... wait no, PDF Y=0 is bottom, so the top of the page is at Y = pageHeight.

If the overlay is at the very top of the page, the bottom edge of the overlay in PDF points is:
```
pdfBottom = (relY + sigHeight) / renderScale = (0 + 60) / 0.75 = 80 points from top
```

PDF Y = 792 - 80 = 712. That's 80 points from the bottom... NO. Let me think again.

In PDF:
- Y = 0 is at the BOTTOM of the page
- Y = pageHeight is at the TOP of the page

So if the overlay top is at the top of the rendered page (relY = 0), and the overlay height is sigHeight:
- The overlay top in normalized coords: relY / renderScale = 0 (from page top)
- The overlay bottom in normalized coords: (relY + sigHeight) / renderScale = 80 (from page top)
- In PDF: top edge is at pageHeight - 0 = 792, bottom edge is at pageHeight - 80 = 712

So `pdfY` should be 712 (the BOTTOM edge of the signature in PDF coords). pdf-lib positions images from their bottom-left corner, so `pdfY` = 712 is correct.

Let me verify the PDF width/height:
```
pdfWidth = sigWidth / renderScale = 150 / 0.75 = 200
pdfHeight = sigHeight / renderScale = 60 / 0.75 = 80
```

So the signature is 200x80 PDF points at position (0, 712). That means it occupies:
- Left: 0
- Bottom: 712
- Right: 200
- Top: 792 (712 + 80)

Which is at the TOP-LEFT corner of the page. ✅ Correct!

**SC-2: Signature placed after scrolling down**  
1. User scrolls the PDF viewport so the page is shifted up by 200px.
2. `scrollTop = 200`, `scrollLeft = 0`.
3. User places overlay at `{x: 100, y: 400}` (in container coords).
4. `viewportY = 400 - 200 = 200` (relative to visible viewport).
5. If page is still centered: `pageOffsetY = 53`.
6. `relY = 200 - 53 = 147` (147px from top of rendered page).
7. `pdfY = 792 - (147 + 60) / 0.75 = 792 - 207 / 0.75 = 792 - 276 = 516`.
8. The signature goes at Y = 516 in PDF coords (276 points from page top). ✅

**SC-3: Signature placed after scrolling right**  
1. User scrolls viewport 100px to the right.
2. `scrollLeft = 100`, `scrollTop = 0`.
3. Overlay at `{x: 350, y: 53}`.
4. `viewportX = 350 - 100 = 250`.
5. `pageOffsetX = 220.5`.
6. `relX = 250 - 220.5 = 29.5`.
7. `pdfX = 29.5 / 0.75 = 39.3`. ✅ Correct horizontal position.

**SC-4: No registry available (backward compat)**
1. Registry hasn't fired yet (viewer still loading), or registry ref is null.
2. `PdfSignPage` passes `containerSize`, `zoom` as before.
3. `domToPdfCoords` receives no `renderScale` or `scrollOffset`.
4. Falls back to old `containerWidth/containerHeight` based scaling.
5. Position may be slightly off but won't crash. ✅

**SC-5: Signature positioned at bottom of page**
1. User drags overlay to bottom of the visible page area.
2. Overlay at `{x: 220.5, y: 634}` (bottom of page: 53 + 594 - 60 = 587... let me recalculate).
3. `pageOffsetY = 53`, `clientHeight = 700`, `pageHeight * scale = 594`.
4. Bottom of rendered page is at `pageOffsetY + pageHeight * scale = 53 + 594 = 647` from viewport top.
5. Overlay bottom at `y + sigHeight = 634 + 60 = 694` is OUTSIDE the rendered page area (> 647).
6. This should be clamped or the overlay should not be allowed past the page bounds.
7. If the system allows it (current behavior uses `containerSize` for clamping), the fallback path handles it. With `renderScale` path, the position will be negative in PDF space, which the user should be warned about or prevented from doing via clamping.

### Implementation Notes

**New types in `types/signature.ts`**:
```ts
// Extend SignPdfParams with optional fields
export interface SignPdfParams {
  // ... existing fields
  /** Actual render scale from embedpdf ZoomCapability */
  renderScale?: number;
  /** Scroll offset of the viewport */
  scrollOffset?: { x: number; y: number };
}
```

**Rewrite `domToPdfCoords` in `lib/pdf-signing.ts`**:

```typescript
function domToPdfCoords(params: {
  domX: number;
  domY: number;
  sigWidth: number;
  sigHeight: number;
  containerWidth: number;
  containerHeight: number;
  pageWidth: number;
  pageHeight: number;
  zoom: number;
  renderScale?: number;
  scrollOffset?: { x: number; y: number };
  clientWidth?: number;
  clientHeight?: number;
}): { pdfX: number; pdfY: number; pdfWidth: number; pdfHeight: number } {
  const {
    domX, domY, sigWidth, sigHeight,
    containerWidth, containerHeight,
    pageWidth, pageHeight, zoom,
    renderScale, scrollOffset, clientWidth, clientHeight,
  } = params;

  // If we have the actual render metrics, use the accurate path
  if (renderScale !== undefined && scrollOffset && clientWidth && clientHeight) {
    // Step 1: Convert overlay coords (relative to container) to viewport coords
    const viewportX = domX - scrollOffset.x;
    const viewportY = domY - scrollOffset.y;

    // Step 2: Calculate page centering offset
    // When page is smaller than viewport at current scale, it's centered
    const pageOffsetX = Math.max(0, (clientWidth - pageWidth * renderScale) / 2);
    const pageOffsetY = Math.max(0, (clientHeight - pageHeight * renderScale) / 2);

    // Step 3: Position relative to rendered page origin
    const relX = viewportX - pageOffsetX;
    const relY = viewportY - pageOffsetY;

    // Step 4: Convert to PDF points
    const pdfX = relX / renderScale;
    // PDF Y is from bottom, DOM Y is from top
    const pdfY = pageHeight - (relY + sigHeight) / renderScale;
    const pdfWidth = sigWidth / renderScale;
    const pdfHeight = sigHeight / renderScale;

    return { pdfX, pdfY, pdfWidth, pdfHeight };
  }

  // Fallback: original zoom-based logic
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
```

**`signPdf` function changes**:
The `signPdf` function currently destructures `zoom` and `containerSize` from `SignPdfParams`. Update to also destructure `renderScale`, `scrollOffset`, and pass them to `domToPdfCoords`:

```typescript
const {
  position, size, containerSize, pageSize, zoom,
  renderScale, scrollOffset,
} = params;

const { pdfX, pdfY, pdfWidth, pdfHeight } = domToPdfCoords({
  domX: position.x,
  domY: position.y,
  sigWidth: size.width,
  sigHeight: size.height,
  containerWidth: containerSize.width,
  containerHeight: containerSize.height,
  pageWidth: actualPageWidth,
  pageHeight: actualPageHeight,
  zoom,
  renderScale,
  scrollOffset,
  clientWidth: containerSize.width,  // ViewportMetrics.clientWidth
  clientHeight: containerSize.height, // ViewportMetrics.clientHeight
});
```

**PdfSignPage "Apply & Download" handler changes**:

In `handleApplySignature` (line 240-284), before calling `sign()`, query the registry:

```typescript
const handleApplySignature = useCallback(async () => {
  if (!pdfFile || !selectedSignature) { /* ... error handling ... */ return; }

  // Get actual render metrics from embedpdf registry
  let renderScale: number | undefined;
  let scrollOffset: { x: number; y: number } | undefined;
  let viewportClientWidth: number | undefined;
  let viewportClientHeight: number | undefined;

  const registry = registryRef.current;
  if (registry) {
    const zoomPlugin = registry.getPlugin("zoom");
    const viewportPlugin = registry.getPlugin("viewport");
    
    if (zoomPlugin) {
      const zoomCap = zoomPlugin.provides();
      const zoomState = zoomCap.getState();
      renderScale = zoomState.currentZoomLevel;
    }
    
    if (viewportPlugin) {
      const viewportCap = viewportPlugin.provides();
      const metrics = viewportCap.getMetrics();
      scrollOffset = { x: metrics.scrollLeft, y: metrics.scrollTop };
      viewportClientWidth = metrics.clientWidth;
      viewportClientHeight = metrics.clientHeight;
    }
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
    renderScale,
    scrollOffset,
  });
  // ... rest unchanged
}, [/* ... add registryRef */]);
```

**Important: Plugin types**:
The `provides()` method returns `Readonly<TCapability>`. For ZoomPlugin, the capability type is `ZoomCapability`. For ViewportPlugin, it's `ViewportCapability`. These are readonly but the methods (`getState()`, `getMetrics()`) are still callable since they're function properties on the interface.

**Import paths for type references**:
```typescript
import type { PluginRegistry } from "@embedpdf/core";
// ZoomCapability and ViewportCapability types come via:
import type { ZoomCapability } from "@embedpdf/plugin-zoom";
import type { ViewportCapability } from "@embedpdf/plugin-viewport";
// But these are only needed for type annotations, not runtime.
```

**Edge case — registry not yet ready**:
If the user clicks "Apply & Download" before the viewer's `onReady` fires (unlikely in normal flow since PDF must load first, but defensive), `registryRef.current` will be null. The handler falls through to the old `zoom`/`containerSize` path. No crash.

**Edge case — page centering offset is negative**:
When the page is larger than the viewport (high zoom), `pageOffsetX` and `pageOffsetY` clamp to 0 via `Math.max(0, ...)`. This means the page starts at viewport origin. Correct behavior: there's no centering when the page is larger than the viewport.

**Project standard — no `any`**:
The `registry.getPlugin()` returns `T | null`. Cast via the generic: `registry.getPlugin<ZoomPlugin>("zoom")`. If the generic is not available, use `as` with a specific type. Never `as any`.
