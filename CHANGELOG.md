# Changelog

Todos los cambios notables del proyecto serán documentados en este archivo.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/),
y este proyecto se adhiere a [Semantic Versioning](https://semver.org/lang/es/).

## [0.1.1] - 2026-03-13

### ✂️ Agregado - Crop de Imágenes

- Nuevo flujo de recorte para imágenes dentro del editor.
- Modo avatar/perfil con `react-avatar-editor` y exportación PNG.
- Modo foto con `react-advanced-cropper` y presets de proporción.
- El recorte reemplaza el archivo activo en memoria para permitir convertir, comprimir o seguir editando sobre el resultado.
- Limpieza correcta de preview URLs para evitar fugas al actualizar la imagen activa.

### 📄 Agregado - Preview de Documentos

- Preview de PDFs con `@embedpdf/react-pdf-viewer` dentro del editor.
- Preview de formatos Office/HTML/TXT/imagen documental con `react-doc-viewer`.
- Activación de URLs locales de preview para categoría `document` (igual que multimedia).

## [0.1.0] - 2026-03-11

### 🚀 Agregado - Conversión Real de Imágenes

#### Backend Integration

- **API Service completo** (`lib/api-service.ts`)
  - Integración con Convert Easy API (http://127.0.0.1:8000)
  - Support para archivos pequeños (<10MB) con upload completo
  - Support para archivos grandes (>10MB) con chunked upload (5MB chunks)
  - Creación de jobs de conversión
  - Polling automático de status
  - Descarga de archivos convertidos
  - Cancelación de jobs en progreso
  - WebSocket support para updates en tiempo real (preparado)

#### Tipos API

- **API Types completos** (`types/api.ts`)
  - `JobStatus`: Estados de conversión
  - `CreateJobRequest/Response`: Creación de jobs
  - `UploadChunkResponse`: Respuesta de chunks
  - `MergeChunksResponse`: Merge de chunks
  - `StartConversionResponse`: Inicio de conversión
  - `JobStatusResponse`: Status de job
  - `CancelJobRequest/Response`: Cancelación
  - `WebSocketMessage`: Mensajes de WebSocket

#### Flujo de Conversión Completo

- **Upload inteligente**: Detecta tamaño y usa chunking automático si >10MB
- **Progress tracking**: Barra de progreso para upload (0-100%)
- **Status polling**: Actualización automática cada 1 segundo
- **Cancelación**: Botón para cancelar conversión en progreso
- **Descarga automática**: Botón de descarga habilitado al completar

#### UI/UX Mejorado en ActionSidebar

- **Indicador de progreso**:
  - Muestra porcentaje durante upload
  - Spinner animado durante procesamiento
  - Estados claros (Uploading, Processing, Completed, Failed)
- **Feedback visual**:
  - Progress bar para upload
  - Loading spinner para conversión
  - Botón de cancelar visible durante procesamiento
  - Botón de descarga habilitado al completar
- **Toasts informativos**:
  - "Starting conversion" al iniciar
  - "Conversion completed" con formato destino
  - "Conversion failed" con mensaje de error
  - "Conversion cancelled" al cancelar
  - "Download started" con nombre de archivo

#### Integración en Editor

- ActionSidebar actualizado con props `fileId` e `inputFormat`
- Editor page pasa fileId desde sessionStorage
- Limpieza automática de archivos después de descarga

### 🎉 Agregado - Versión Base

#### Core Features

- Sistema de temas (Light/Dark/Blue) con `next-themes`
- Drag & drop de archivos con `FileDropzone`
- Detección automática de tipo de archivo por extensión
- Preview de archivos multimedia (imágenes, video, audio)
- Store en memoria para archivos (`file-store.ts`)
- Sidebar de acciones data-driven basada en categoría de archivo
- Toasts con Sileo para notificaciones
- Header principal con navegación
- Toggle de temas con iconos

#### Componentes UI

- `FileDropzone`: Zona de carga con drag & drop
- `FilePreview`: Preview de archivos con soporte multimedia
- `ActionSidebar`: Sidebar con acciones disponibles (ahora con conversión real)
- `Header`: Header principal
- `ThemeToggle`: Selector de tema
- `ThemeProvider`: Provider de temas
- `SileoProvider`: Provider de toasts

#### Utilidades

- `createFileInfo()`: Crear objeto FileInfo desde File
- `formatFileSize()`: Formatear bytes a KB/MB/GB
- `getCategoryLabel()`: Obtener etiqueta de categoría
- `isLargeFile()`: Verificar si archivo es >10MB
- `storeFile()`: Guardar archivo en memoria
- `getFile()`: Recuperar archivo de memoria
- `createFilePreviewUrl()`: Crear URL de preview
- `revokeFilePreviewUrl()`: Limpiar URL de preview
- `getActionsForCategory()`: Obtener acciones por categoría
- `getConversionOptions()`: Obtener formatos de conversión

#### API Service Functions

- `createJob()`: Crear job de conversión
- `uploadCompleteFile()`: Subir archivo completo
- `uploadChunk()`: Subir chunk individual
- `mergeChunks()`: Mergear chunks subidos
- `startConversion()`: Iniciar conversión
- `getJobStatus()`: Obtener status de job
- `cancelJob()`: Cancelar job
- `downloadResult()`: Descargar resultado
- `createJobWebSocket()`: Crear conexión WebSocket
- `uploadFile()`: Upload inteligente con auto-chunking
- `convertFile()`: Flujo completo de conversión
- `pollJobStatus()`: Polling automático de status

#### Tipos TypeScript

- `FileCategory`: Tipo de categoría de archivo
- `FileState`: Estados de un archivo
- `FileInfo`: Información completa de archivo
- `Action`: Definición de acción
- `ConversionOption`: Opción de conversión
- `JobStatus`: Estados de job API
- Tipos completos de request/response para API

#### UI/UX

- Animaciones al arrastrar archivos
- Feedback visual en estados hover/drag
- Toasts con auto-expansión para archivos grandes
- Preview responsivo de medios
- Controles nativos para video/audio
- Diseño responsive para móvil y desktop
- **Progress bar en tiempo real durante conversión**
- **Botón de cancelar durante procesamiento**
- **Botón de descarga al completar**

#### Configuración

- Next.js 16 con Turbopack
- App Router de Next.js
- Tailwind CSS para estilos
- shadcn/ui como biblioteca de componentes
- TypeScript estricto
- ESLint configurado
- Vercel Analytics integrado

### ✨ Mejorado

#### Optimizaciones

- Imports específicos de React (no `import * as React`)
- Suspense boundaries para carga asíncrona
- useMemo para preview URLs
- Lazy loading de componentes del editor
- Iconos personalizados por categoría en toasts
- **Chunked upload automático para archivos >10MB**
- **Polling eficiente con timeout de 5 minutos**

#### UX

- Mensaje especial en toast para archivos >10MB
- Descripción visible en toasts (color de texto mejorado)
- Duración extendida de toasts para archivos grandes
- **Feedback claro durante todo el proceso de conversión**
- **Estados visuales para cada fase (upload, processing, completed)**
- **Mensajes de error descriptivos**
- Iconos contextuales en notificaciones

### 🔧 Corregido

- Error de prerender en `/editor` por uso de `useSearchParams` sin Suspense
- Imports de namespace de React reemplazados por imports específicos
- Toast de "file detected" eliminado (redundante)
- Estilos de descripción en toasts (texto no visible)
- Import faltante de `getCategoryLabel` y `formatFileSize`

### 📚 Documentación

- README.md principal con overview del proyecto
- ARCHITECTURE.md con arquitectura detallada
- COMPONENTS.md con guía de componentes
- FILE_API.md con documentación de API de archivos
- CHANGELOG.md para trackear cambios
- Estructura de carpeta `/docs` creada

### 🎨 Diseño

- Paleta de colores Blue personalizada
- Variables CSS para temas
- Favicon completo con múltiples tamaños
- Iconos para Android, iOS, Windows

---

## [0.1.0] - 2026-03-10

### 🎉 Versión Inicial

- Setup inicial del proyecto
- Configuración de Next.js 16
- Instalación de dependencias base
- Configuración de TypeScript
- Setup de Tailwind CSS

---

## 📋 Próximos Features Planeados

### v0.2.0 - Conversión Básica

- [ ] Conversión de documentos (PDF ↔ DOCX)
- [ ] Conversión de imágenes (JPG ↔ PNG ↔ WebP)
- [ ] API backend para conversión
- [ ] Indicador de progreso

### v0.3.0 - Procesamiento Local

- [ ] FFmpeg.wasm para conversión de video/audio
- [ ] Sharp para procesamiento de imágenes
- [ ] Compresión de archivos
- [ ] Web Workers para procesamiento

### v0.4.0 - Features Avanzados

- [ ] Upload con chunks para archivos grandes
- [ ] Encriptación end-to-end
- [ ] Historial de conversiones
- [ ] Conversión por lotes

### v0.5.0 - Mejoras de Calidad

- [ ] Tests unitarios con Vitest
- [ ] Tests E2E con Playwright
- [ ] Optimizaciones de performance
- [ ] Mejoras de accesibilidad (a11y)

### v1.0.0 - Producción

- [ ] Todas las features core implementadas
- [ ] Testing completo
- [ ] Documentación final
- [ ] Deploy a producción

---

## 🏷️ Tipos de Cambios

- **🎉 Agregado**: Para nuevas features
- **✨ Mejorado**: Para mejoras en features existentes
- **🔧 Corregido**: Para bug fixes
- **🗑️ Eliminado**: Para features removidas
- **🔒 Seguridad**: Para fixes de seguridad
- **📚 Documentación**: Para cambios en documentación
- **🎨 Diseño**: Para cambios en UI/UX
- **⚡ Performance**: Para mejoras de performance
- **♿ Accesibilidad**: Para mejoras de a11y
- **🔨 Refactor**: Para refactorizaciones de código
