# Arquitectura del Proyecto

## 🏗️ Visión General

Convert Easy es una aplicación Next.js 16 de conversión de archivos con enfoque en privacidad. El frontend se comunica con un backend FastAPI para procesamiento de archivos, con soporte para conversiones, compresión, edición de PDFs, procesamiento de imágenes/audio/video, y firma de documentos.

## 📐 Arquitectura de Componentes

```
┌─────────────────────────────────────────────────────────┐
│                 Root Layout                             │
│  ┌───────────────────────────────────────────────────┐ │
│  │  ThemeProvider (Light/Dark/Blue)                  │ │
│  │  ┌─────────────────────────────────────────────┐  │ │
│  │  │  SileoProvider (Toasts)                     │  │ │
│  │  │  ┌───────────────────────────────────────┐  │  │ │
│  │  │  │  Page Content (App Router routes)     │  │  │ │
│  │  │  │  + Vercel Analytics                   │  │  │ │
│  │  │  └───────────────────────────────────────┘  │  │ │
│  │  └─────────────────────────────────────────────┘  │ │
│  └───────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

## 🗺️ Rutas (App Router)

| Ruta | Archivo | Tipo | Descripción |
|------|---------|------|-------------|
| `/` | `app/page.tsx` | Static | Landing page con hero + FileDropzone + features |
| `/editor` | `app/editor/page.tsx` | Dynamic | Editor de archivos con preview y sidebar de acciones |
| `/convert/[slug]` | `app/convert/[slug]/page.tsx` | Dynamic | Página de conversión (ej: `/convert/pdf`, `/convert/docx-to-pdf`) |
| `/tools/[slug]` | `app/tools/[slug]/page.tsx` | Dynamic | Página de herramientas (ej: `/tools/pdf-sign`, `/tools/trim-video`) |

### Error Boundaries

- `/convert/[slug]/loading.tsx` — Loading state para conversiones
- `/convert/[slug]/error.tsx` — Error boundary para conversiones

## 🔄 Flujo de Conversión (IMPLEMENTADO)

### 1. Carga de Archivo

```
Usuario arrastra archivo → FileDropzone
    ↓
createFileInfo() extrae metadatos
    ↓
storeFile() guarda en memoria (Map)
    ↓
sessionStorage guarda metadatos
    ↓
Router navega a /editor
```

### 2. Conversión vía Backend

```
Usuario selecciona acción (convert/compress/etc)
    ↓
createJob() crea trabajo en backend
    ↓
uploadFile() sube archivo (endpoint /file para <10MB)
    ↓
startConversion() o processDocument() inicia procesamiento
    ↓
pollJobStatus() o WebSocket monitorea progreso
    ↓
downloadResult() descarga archivo convertido
```

### 3. Herramientas Especializadas

```
Usuario navega a /tools/[slug]
    ↓
ToolPage renderiza según configuración
    ↓
Upload + operación específica (sign, trim, compress, etc)
    ↓
Resultado descargable
```

## 🗂️ Gestión de Estado

### Client State

- **React Hooks**: useState, useEffect, useMemo, useCallback
- **File Store** (`lib/file-store.ts`): Map en memoria para archivos cargados
- **Session Storage**: Metadatos de archivos entre navegaciones
- **Signature Store** (`lib/signature-store.ts` + `hooks/use-signature-store.ts`): Persistencia de firmas
- **Conversion State** (`hooks/use-conversion.ts`): Estado de conversión (idle→uploading→converting→completed/error)

### Custom Hooks

| Hook | Archivo | Propósito |
|------|---------|-----------|
| `useConversion` | `hooks/use-conversion.ts` | Gestión completa de conversión (upload, poll, download, cancel) |
| `useSignatureStore` | `hooks/use-signature-store.ts` | Gestión de firmas dibujadas/texto |
| `usePdfSigning` | `hooks/use-pdf-signing.ts` | Flujo de firma de PDFs |
| `useDragResize` | `hooks/use-drag-resize.ts` | Redimensionamiento por drag |
| `useMobile` | `hooks/use-mobile.ts` | Detección de viewport mobile |
| `useToast` | `hooks/use-toast.ts` | Legacy toast hook (usar `sonner` directamente) |

## 📦 Módulos Principales

### `/lib/api-service.ts` (973 líneas)

Servicio completo de comunicación con el backend FastAPI:

**Conversión básica:**
- `createJob()` — Crea trabajo de conversión
- `uploadFile()` — Sube archivo (auto chunking)
- `startConversion()` — Inicia conversión
- `getJobStatus()` — Obtiene estado del trabajo
- `pollJobStatus()` — Polling hasta completado/fallo
- `downloadResult()` — Descarga resultado
- `cancelJob()` — Cancela trabajo
- `createJobWebSocket()` — WebSocket para updates en tiempo real

**Procesamiento de documentos:**
- `processDocument()` — Pipeline de conversión de documentos

**Procesamiento de imágenes:**
- `removeBackground()` — Remover fondo con IA
- `compressImage()` — Comprimir imagen
- `addWatermark()` — Agregar marca de agua
- `processImageFile()` — Flujo completo con polling

**Procesamiento de PDF:**
- `processPdfFile()` — Operaciones PDF (merge, split, encrypt, etc)
- `createUploadedJob()` — Crear job con upload
- `queuePdfMergeFromJobs()` — Unir múltiples PDFs

**Procesamiento de audio:**
- `processAudio()` — Operación de audio
- `processAudioFile()` — Flujo completo con polling

**Procesamiento de video:**
- `processVideo()` — Operación de video
- `processVideoFile()` — Flujo completo con polling

**Conversión XML:**
- `convertXmlToJson()` — XML → JSON
- `convertXmlToYaml()` — XML → YAML
- `convertXmlToHtml()` — XML → HTML
- `convertXmlToCsv()` — XML → CSV

### `/lib/conversion-config.ts`

Configuración data-driven de conversiones y herramientas:

- `CONVERSION_CONFIGS` — 12 configuraciones de conversión (docx→pdf, pdf→*, video→*, audio→*)
- `TOOL_CONFIGS` — 8 herramientas (pdf-organize, pdf-sign, pdf-protect, pdf-compress, extract-audio, trim-video, trim-audio, normalize-audio)
- `getConversionConfig()`, `getToolConfig()` — Helpers de acceso

### `/lib/file-store.ts`

Store en memoria con Map:
- `storeFile()`, `getFile()`, `removeFile()`, `clearAllFiles()`
- `createFilePreviewUrl()`, `revokeFilePreviewUrl()`

### `/lib/file-utils.ts`

Utilidades de archivos:
- `createFileInfo()`, `formatFileSize()`, `getCategoryLabel()`, `isLargeFile()`

### `/lib/file-actions.ts`

Configuración de acciones por categoría de archivo.

### `/lib/nav-config.ts`

Configuración de navegación del header.

### `/lib/mail.ts`

Servicio de email con Resend:
- `mail.send()` — Envía emails con adjuntos

### `/lib/env.ts`

Validación de variables de entorno con Zod.

### `/lib/pdf-signing.ts`

Utilidades para firma de PDFs.

### `/lib/signature-store.ts`

Store para firmas (drawn + text signatures).

### `/lib/image-crop.ts`

Utilidades para recorte de imágenes (react-advanced-cropper).

### `/lib/video-constants.ts` / `/lib/audio-constants.ts`

Constantes de formatos y opciones para video y audio.

## 🎨 Sistema de Temas

### Implementación

```css
/* globals.css */
:root { /* Light theme */ }
.dark { /* Dark theme */ }
.blue { /* Blue theme */ }
```

### Paleta Blue

```css
--primary: #3584e4;
--primary-foreground: #ffffff;
--background: #0b1a2e;
--foreground: #d7e6fa;
```

### Provider

```tsx
<ThemeProvider
  attribute="class"
  defaultTheme="system"
  enableSystem
  themes={["light", "dark", "blue"]}
  disableTransitionOnChange
>
```

## 🔌 Integraciones

### Backend API

- **Framework**: FastAPI
- **URL**: `NEXT_PUBLIC_API_URL` (dev: `http://127.0.0.1:8000`)
- **WebSocket**: `ws://127.0.0.1:8000/api/v1/ws/jobs/{jobId}`
- **Endpoints**: `/api/v1/upload/*`, `/api/v1/jobs/*`, `/api/v1/process/*`, `/api/v1/convert/*`

### Email (Resend)

- **API Key**: `RESEND_API_KEY`
- **Destino**: `RESEND_EMAIL`
- **Uso**: Support dialog con adjuntos

### Analytics

- **Vercel Analytics** integrado en `app/layout.tsx`

## 🔒 Seguridad

### Validación de Archivos

- Verificación de extensiones permitidas
- Validación de MIME types
- Límites de tamaño (100MB max)
- Sanitización de nombres de archivo

### Error Sanitization

- `sanitizeErrorMessage()` en `api-service.ts` elimina paths internos y tracebacks de Python
- Mensajes de error user-friendly en español

### Rate Limiting (Support)

- Server: 5 emails/día por IP (Map en memoria)
- Client: 5 emails/día por localStorage

## 🚀 Performance

### Optimizaciones Implementadas

- Turbopack para desarrollo rápido
- Polling inteligente (1s interval, 300 max attempts = 5 min timeout)
- WebSocket para updates en tiempo real
- Lazy loading de componentes
- Suspense boundaries

## 📊 Métricas

- Vercel Analytics integrado
- Tracking de conversiones exitosas/fallidas

## 🧪 Testing

### Planeado

- Vitest para utilidades
- Playwright para E2E
- Testing Library para componentes
