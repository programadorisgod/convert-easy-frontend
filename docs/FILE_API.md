# API de Archivos

## 📚 Utilidades de Archivos

### `/lib/file-utils.ts`

#### `createFileInfo(file: File): FileInfo`

Crea un objeto FileInfo a partir de un File nativo del navegador.

```typescript
const fileInfo = createFileInfo(file)
// { id: "uuid", name: "doc.pdf", size: 1024, category: "document", ... }
```

#### `formatFileSize(bytes: number): string`

```typescript
formatFileSize(1024)       // "1 KB"
formatFileSize(1048576)    // "1 MB"
```

#### `getCategoryLabel(category: FileCategory): string`

```typescript
getCategoryLabel("document") // "Documento"
getCategoryLabel("image")    // "Imagen"
```

#### `isLargeFile(size: number): boolean`

Verifica si un archivo es mayor a 10MB.

---

### `/lib/file-store.ts`

Store en memoria para archivos cargados. Usa un `Map<string, File>` interno.

| Función | Descripción |
|---------|-------------|
| `storeFile(id, file)` | Guarda un archivo en el store |
| `getFile(id)` | Recupera un archivo del store |
| `removeFile(id)` | Elimina un archivo del store |
| `clearAllFiles()` | Limpia todos los archivos |
| `createFilePreviewUrl(file)` | Crea URL temporal para preview |
| `revokeFilePreviewUrl(url)` | Revoca URL de preview para liberar memoria |

---

## 🔌 API Service (`lib/api-service.ts`)

Servicio completo de comunicación con el backend FastAPI.

### Constantes

```typescript
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"
const CHUNK_SIZE = 5 * 1024 * 1024        // 5MB
const LARGE_FILE_THRESHOLD = 10 * 1024 * 1024  // 10MB
```

### Conversión Básica

| Función | Endpoint | Descripción |
|---------|----------|-------------|
| `createJob(request)` | `POST /api/v1/upload/create` | Crea trabajo de conversión |
| `uploadFile(file, jobId, onProgress)` | `POST /api/v1/upload/{id}/file` | Sube archivo completo |
| `uploadChunk(jobId, index, chunk)` | `POST /api/v1/upload/{id}/chunk` | Sube un chunk |
| `mergeChunks(jobId)` | `POST /api/v1/upload/{id}/merge` | Une chunks |
| `startConversion(jobId)` | `POST /api/v1/upload/{id}/start` | Inicia conversión |
| `getJobStatus(jobId)` | `GET /api/v1/jobs/{id}` | Obtiene estado |
| `pollJobStatus(jobId, callback)` | `GET /api/v1/jobs/{id}` | Polling hasta completado |
| `downloadResult(jobId, format)` | `GET /api/v1/jobs/{id}/download` | Descarga resultado |
| `cancelJob(jobId)` | `POST /api/v1/jobs/{id}/cancel` | Cancela trabajo |
| `createJobWebSocket(jobId, onMessage)` | `WS /api/v1/ws/jobs/{id}` | WebSocket en tiempo real |
| `convertFile(file, input, output, onProgress)` | Múltiple | Flujo completo: create → upload → start |

### Procesamiento de Documentos

| Función | Endpoint | Descripción |
|---------|----------|-------------|
| `processDocument(request)` | `POST /api/v1/process/document` | Pipeline de conversión de documentos |

### Procesamiento de Imágenes

| Función | Endpoint | Descripción |
|---------|----------|-------------|
| `removeBackground(request)` | `POST /api/v1/process/remove-background` | Remover fondo con IA |
| `compressImage(request)` | `POST /api/v1/process/compress` | Comprimir imagen |
| `addWatermark(request)` | `POST /api/v1/process/watermark` | Agregar marca de agua |
| `processImageFile(file, format, op, params, onProgress)` | Múltiple | Flujo completo con polling |

### Procesamiento de PDF

| Función | Endpoint | Descripción |
|---------|----------|-------------|
| `processPdfFile(file, format, op, params, onProgress)` | `POST /api/v1/process/pdf/{op}` | Operaciones PDF |
| `createUploadedJob(file, input, output)` | Múltiple | Crear job con upload |
| `queuePdfMergeFromJobs(primaryId, sourceIds)` | `POST /api/v1/process/pdf/merge` | Unir múltiples PDFs |

Operaciones PDF soportadas: `merge`, `split-range`, `extract-pages`, `delete-pages`, `rotate`, `metadata`, `encrypt`, `decrypt`, `add-text`, `add-image`, `draw-rectangle`, `add-annotation`, `set-mediabox`, `compress`, `extract-audio`, `trim`, `normalize`, `sign`

### Procesamiento de Audio

| Función | Endpoint | Descripción |
|---------|----------|-------------|
| `processAudio(request)` | `POST /api/v1/process/audio` | Operación de audio |
| `processAudioFile(file, input, output, params, onProgress)` | Múltiple | Flujo completo con polling |

### Procesamiento de Video

| Función | Endpoint | Descripción |
|---------|----------|-------------|
| `processVideo(request)` | `POST /api/v1/process/video` | Operación de video |
| `processVideoFile(file, input, output, params, onProgress)` | Múltiple | Flujo completo con polling |

### Conversión XML

| Función | Endpoint | Descripción |
|---------|----------|-------------|
| `convertXmlToJson(file, options)` | `POST /api/v1/convert/xml/json` | XML → JSON |
| `convertXmlToYaml(file, options)` | `POST /api/v1/convert/xml/yaml` | XML → YAML |
| `convertXmlToHtml(file, options)` | `POST /api/v1/convert/xml/html` | XML → HTML |
| `convertXmlToCsv(file, options)` | `POST /api/v1/convert/xml/csv` | XML → CSV |

### Manejo de Errores

```typescript
// handleApiError() traduce status codes a mensajes en español:
// 500 → "Ocurrió un error interno..."
// 413 → "El archivo es demasiado grande..."
// 429 → "Has alcanzado el límite de conversiones..."
// 422 → "El formato del archivo no es válido..."

// sanitizeErrorMessage() elimina paths internos y tracebacks de Python
```

---

## 🔄 Hooks de Conversión

### `useConversion(config: ConversionConfig)`

Hook principal para gestionar el ciclo de vida de una conversión.

```typescript
const {
  status,           // "idle" | "uploading" | "converting" | "completed" | "error"
  progress,         // 0-100
  error,            // string | null
  result,           // { jobId, outputFormat } | null
  isConverting,     // boolean
  startConversion,  // (file: File) => Promise<void>
  reset,            // () => void
  downloadFile,     // () => Promise<void>
  cancel,           // () => void
} = useConversion(config)
```

### `useSignatureStore()`

Gestión de firmas (drawn + text).

### `usePdfSigning()`

Flujo completo de firma de PDFs.

---

## 📦 Tipos TypeScript

### FileCategory

```typescript
type FileCategory = "document" | "image" | "video" | "audio" | "unknown"
```

### FileState

```typescript
type FileState =
  | "idle" | "selected" | "uploading" | "queued"
  | "processing" | "completed" | "error"
```

### FileInfo

```typescript
interface FileInfo {
  id: string
  name: string
  size: number
  type: string
  extension: string
  category: FileCategory
  file: File
  previewUrl?: string
  state: FileState
  error?: string
  progress?: number
}
```

### ConversionConfig

```typescript
interface ConversionConfig {
  slug: string
  label: string
  description: string
  sourceExtensions: string[]
  targetFormat: string
  category: FileCategory
  icon: LucideIcon
  href: string
  type: ActionType
  operation: string
}
```

### ToolConfig

```typescript
interface ToolConfig {
  slug: string
  label: string
  description: string
  category: FileCategory
  icon: LucideIcon
  href: string
  sourceExtensions?: string[]
  type: ActionType
  operation: string
  outputFormat?: string
  acceptsMultiple?: boolean
}
```

### ActionType

```typescript
type ActionType =
  | "convert" | "compress" | "organize" | "sign"
  | "protect" | "extract" | "trim" | "normalize"
```

---

## 🔄 Flujos de Trabajo

### Flujo de Conversión Completo

```typescript
// 1. Usuario selecciona archivo
const file: File = event.dataTransfer.files[0]

// 2. Crear FileInfo
const fileInfo = createFileInfo(file)

// 3. Guardar en store
storeFile(fileInfo.id, file)

// 4. Navegar al editor
router.push(`/editor?file=${fileInfo.id}`)

// 5. En la página de conversión:
const { startConversion, status, progress, downloadFile } = useConversion(config)

// 6. Iniciar conversión
await startConversion(file)

// 7. Esperar completado
// status cambia: idle → uploading → converting → completed

// 8. Descargar resultado
await downloadFile()
```

### Flujo de Firma de PDF

```typescript
// 1. Usuario sube PDF
// 2. Abre overlay de firma
// 3. Dibuja o selecciona firma de texto
// 4. Coloca firma en el PDF
// 5. Envía al backend para aplicar firma
// 6. Descarga PDF firmado
```
