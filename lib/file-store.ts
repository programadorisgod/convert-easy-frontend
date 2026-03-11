// Simple in-memory store for uploaded files
// This allows us to access the actual File object for preview purposes

const fileStore = new Map<string, File>()

export function storeFile(id: string, file: File): void {
  fileStore.set(id, file)
}

export function getFile(id: string): File | undefined {
  return fileStore.get(id)
}

export function removeFile(id: string): void {
  fileStore.delete(id)
}

export function clearAllFiles(): void {
  fileStore.clear()
}

export function createFilePreviewUrl(file: File): string {
  return URL.createObjectURL(file)
}

export function revokeFilePreviewUrl(url: string): void {
  URL.revokeObjectURL(url)
}
