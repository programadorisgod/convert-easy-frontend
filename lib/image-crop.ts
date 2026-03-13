const SUPPORTED_CANVAS_EXPORT_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
])

const MIME_TYPE_TO_EXTENSION: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
}

type CropExportMode = "avatar" | "image"

function getBaseFileName(fileName: string): string {
  const extensionIndex = fileName.lastIndexOf(".")
  if (extensionIndex <= 0) {
    return fileName
  }

  return fileName.slice(0, extensionIndex)
}

function getExportMimeType(file: File, mode: CropExportMode): string {
  if (mode === "avatar") {
    return "image/png"
  }

  if (SUPPORTED_CANVAS_EXPORT_TYPES.has(file.type)) {
    return file.type
  }

  return "image/png"
}

function getExportExtension(mimeType: string): string {
  return MIME_TYPE_TO_EXTENSION[mimeType] ?? "png"
}

export function canvasToBlob(
  canvas: HTMLCanvasElement,
  mimeType: string,
  quality?: number,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("No se pudo exportar el recorte."))
          return
        }

        resolve(blob)
      },
      mimeType,
      quality,
    )
  })
}

export async function createCroppedImageFile(
  canvas: HTMLCanvasElement,
  originalFile: File,
  mode: CropExportMode,
): Promise<File> {
  const mimeType = getExportMimeType(originalFile, mode)
  const extension = getExportExtension(mimeType)
  const fileName = `${getBaseFileName(originalFile.name)}_${mode}.${extension}`
  const quality = mimeType === "image/png" ? undefined : 0.92
  const blob = await canvasToBlob(canvas, mimeType, quality)

  return new File([blob], fileName, {
    type: mimeType,
    lastModified: Date.now(),
  })
}