# API de Archivos

## 📚 Módulos de Utilidades

### `/lib/file-utils.ts`

#### `createFileInfo(file: File): FileInfo`

Crea un objeto FileInfo a partir de un File nativo del navegador.

```typescript
const file = new File(['content'], 'doc.pdf', { type: 'application/pdf' })
const fileInfo = createFileInfo(file)
```

**Retorna:**
```typescript
{
  id: string,           // UUID único
  name: string,         // Nombre del archivo
  size: number,         // Tamaño en bytes
  type: string,         // MIME type
  extension: string,    // Extensión sin punto
  category: FileCategory, // Categoría detectada
  file: File,           // Archivo original
  state: "idle"         // Estado inicial
}
```

---

#### `formatFileSize(bytes: number): string`

Formatea bytes a unidades legibles.

```typescript
formatFileSize(1024)      // "1 KB"
formatFileSize(1048576)   // "1 MB"
formatFileSize(1073741824) // "1 GB"
```

---

#### `getCategoryLabel(category: FileCategory): string`

Obtiene etiqueta legible de categoría.

```typescript
getCategoryLabel("document") // "Documento"
getCategoryLabel("image")    // "Imagen"
getCategoryLabel("video")    // "Video"
getCategoryLabel("audio")    // "Audio"
getCategoryLabel("unknown")  // "Archivo"
```

---

#### `isLargeFile(size: number): boolean`

Verifica si un archivo es mayor a 10MB.

```typescript
isLargeFile(5 * 1024 * 1024)  // false (5MB)
isLargeFile(15 * 1024 * 1024) // true (15MB)
```

**Constante:**
```typescript
const LARGE_FILE_THRESHOLD = 10 * 1024 * 1024 // 10MB
```

---

### `/lib/file-store.ts`

Store en memoria para archivos cargados. Usa un `Map<string, File>` interno.

#### `storeFile(id: string, file: File): void`

Guarda un archivo en el store.

```typescript
const file = new File(['content'], 'doc.pdf')
const fileId = crypto.randomUUID()
storeFile(fileId, file)
```

---

#### `getFile(id: string): File | undefined`

Recupera un archivo del store.

```typescript
const file = getFile(fileId)
if (file) {
  console.log('Archivo encontrado:', file.name)
}
```

---

#### `removeFile(id: string): void`

Elimina un archivo del store.

```typescript
removeFile(fileId)
```

---

#### `clearAllFiles(): void`

Limpia todos los archivos del store.

```typescript
clearAllFiles()
```

---

#### `createFilePreviewUrl(file: File): string`

Crea una URL temporal para preview.

```typescript
const previewUrl = createFilePreviewUrl(file)
// Usar en <img src={previewUrl} /> o <video src={previewUrl} />

// IMPORTANTE: Revocar cuando ya no se use
revokeFilePreviewUrl(previewUrl)
```

---

#### `revokeFilePreviewUrl(url: string): void`

Revoca una URL de preview para liberar memoria.

```typescript
revokeFilePreviewUrl(previewUrl)
```

---

### `/lib/file-actions.ts`

Configuración data-driven de acciones por categoría.

#### `getActionsForCategory(category: FileCategory): Action[]`

Obtiene acciones disponibles para una categoría.

```typescript
const actions = getActionsForCategory("document")
// [
//   { id: "convert", label: "Convertir", icon: FileType },
//   { id: "compress", label: "Comprimir", icon: Archive },
//   ...
// ]
```

**Tipos:**
```typescript
interface Action {
  id: string
  label: string
  icon: LucideIcon
  description?: string
}
```

---

#### `getConversionOptions(category: FileCategory): ConversionOption[]`

Obtiene formatos de conversión disponibles.

```typescript
const options = getConversionOptions("image")
// [
//   { value: "jpg", label: "JPG" },
//   { value: "png", label: "PNG" },
//   ...
// ]
```

**Tipos:**
```typescript
interface ConversionOption {
  value: string
  label: string
  description?: string
}
```

---

## 🔍 Detección de Categorías

### Mapeo de Extensiones

```typescript
const categoryMap = {
  // Documentos
  pdf: "document",
  doc: "document",
  docx: "document",
  odt: "document",
  txt: "document",
  md: "document",
  html: "document",
  
  // Imágenes
  jpg: "image",
  jpeg: "image",
  png: "image",
  gif: "image",
  webp: "image",
  svg: "image",
  bmp: "image",
  tiff: "image",
  heic: "image",
  
  // Videos
  mp4: "video",
  mkv: "video",
  avi: "video",
  webm: "video",
  mov: "video",
  flv: "video",
  
  // Audio
  mp3: "audio",
  wav: "audio",
  flac: "audio",
  ogg: "audio",
  aac: "audio",
  m4a: "audio",
}
```

---

## 📦 Tipos TypeScript

### FileCategory

```typescript
type FileCategory = 
  | "document" 
  | "image" 
  | "video" 
  | "audio" 
  | "unknown"
```

---

### FileState

```typescript
type FileState = 
  | "idle"        // Estado inicial
  | "selected"    // Archivo seleccionado
  | "uploading"   // Subiendo a servidor
  | "queued"      // En cola para procesamiento
  | "processing"  // Procesándose
  | "completed"   // Completado
  | "error"       // Error
```

---

### FileInfo

```typescript
interface FileInfo {
  id: string              // UUID único
  name: string            // Nombre del archivo
  size: number            // Tamaño en bytes
  type: string            // MIME type
  extension: string       // Extensión sin punto
  category: FileCategory  // Categoría detectada
  file: File              // Archivo original del navegador
  previewUrl?: string     // URL temporal de preview
  state: FileState        // Estado actual
  error?: string          // Mensaje de error si aplica
  progress?: number       // Progreso 0-100 si aplica
}
```

---

### Action

```typescript
interface Action {
  id: string              // Identificador único
  label: string           // Texto a mostrar
  icon: LucideIcon        // Icono del componente
  description?: string    // Descripción opcional
  disabled?: boolean      // Si está deshabilitado
}
```

---

### ConversionOption

```typescript
interface ConversionOption {
  value: string           // Valor del formato (ej: "pdf")
  label: string           // Etiqueta (ej: "PDF")
  description?: string    // Descripción del formato
  icon?: LucideIcon       // Icono opcional
}
```

---

## 🔄 Flujos de Trabajo

### Flujo de Carga de Archivo

```typescript
// 1. Usuario selecciona/arrastra archivo
const file: File = event.dataTransfer.files[0]

// 2. Crear FileInfo con metadatos
const fileInfo = createFileInfo(file)
// { id: "uuid", name: "doc.pdf", category: "document", ... }

// 3. Guardar en store
storeFile(fileInfo.id, file)

// 4. Guardar metadatos en sessionStorage
sessionStorage.setItem("pendingFile", JSON.stringify({
  id: fileInfo.id,
  name: fileInfo.name,
  size: fileInfo.size,
  type: fileInfo.type,
  extension: fileInfo.extension,
  category: fileInfo.category,
}))

// 5. Navegar al editor
router.push(`/editor?file=${fileInfo.id}`)
```

---

### Flujo de Preview

```typescript
// 1. Recuperar info del archivo
const stored = sessionStorage.getItem("pendingFile")
const fileInfo = JSON.parse(stored)

// 2. Recuperar archivo del store
const file = getFile(fileInfo.id)

// 3. Crear URL de preview (solo para media)
const previewUrl = useMemo(() => {
  if (!file) return undefined
  if (["image", "video", "audio"].includes(fileInfo.category)) {
    return createFilePreviewUrl(file)
  }
  return undefined
}, [file, fileInfo])

// 4. Usar en componente
<FilePreview previewUrl={previewUrl} />

// 5. Limpiar al desmontar
useEffect(() => {
  return () => {
    if (previewUrl) {
      revokeFilePreviewUrl(previewUrl)
    }
  }
}, [previewUrl])
```

---

### Flujo de Conversión (Futuro)

```typescript
// 1. Usuario selecciona formato
const targetFormat = "pdf"

// 2. Verificar tamaño
const isLarge = isLargeFile(fileInfo.size)

// 3. Mostrar toast apropiado
sileo.success({
  title: "Conversión iniciada",
  description: isLarge 
    ? "Archivo grande, puedes continuar usando la app"
    : `Convirtiendo a ${targetFormat.toUpperCase()}...`
})

// 4. Procesar según tamaño
if (isLarge) {
  // Upload con chunks + procesamiento servidor
  await uploadAndConvert(file, targetFormat)
} else {
  // Procesamiento local con WebAssembly
  await convertLocally(file, targetFormat)
}

// 5. Descargar resultado
downloadResult(convertedFile)
```

---

## 🎯 Best Practices

### Memoria
- Siempre revocar preview URLs cuando ya no se usen
- Limpiar archivos del store después de procesar
- Usar `useMemo` para cálculos derivados costosos

### Performance
- No crear preview URLs innecesariamente
- Usar lazy loading para componentes pesados
- Considerar Web Workers para procesamiento pesado

### Seguridad
- Validar extensiones antes de procesar
- Sanitizar nombres de archivo
- Verificar tamaños máximos
- No confiar solo en MIME types del cliente

### UX
- Mostrar progreso para operaciones largas
- Dar feedback inmediato con toasts
- Indicar claramente cuando puede continuar usando la app
- Manejar errores gracefully

---

## 🔮 APIs Futuras (Planeadas)

### Conversión Local
```typescript
// WebAssembly para procesamiento cliente
await convertWithFFmpeg(file, "mp4")
await compressWithSharp(file, { quality: 80 })
await convertPdfWithPdfLib(file, options)
```

### Upload Encriptado
```typescript
// Upload seguro con chunks
await uploadLargeFile(file, {
  chunkSize: 5 * 1024 * 1024, // 5MB
  encryption: true,
  onProgress: (progress) => console.log(progress)
})
```

### Procesamiento Servidor
```typescript
// API endpoint para conversión
const result = await fetch('/api/convert', {
  method: 'POST',
  body: formData
})
```
