# Arquitectura del Proyecto

## 🏗️ Visión General

Convert Easy es una aplicación de conversión de archivos que prioriza la privacidad del usuario mediante procesamiento local y uploads encriptados.

## 📐 Arquitectura de Componentes

```
┌─────────────────────────────────────────────┐
│           App Layout (Root)                 │
│  ┌─────────────────────────────────────┐   │
│  │  ThemeProvider (Light/Dark/Blue)    │   │
│  │  ┌───────────────────────────────┐  │   │
│  │  │     SileoProvider (Toasts)    │  │   │
│  │  │  ┌─────────────────────────┐  │  │   │
│  │  │  │   Page Content          │  │  │   │
│  │  │  └─────────────────────────┘  │  │   │
│  │  └───────────────────────────────┘  │   │
│  └─────────────────────────────────────┘   │
└─────────────────────────────────────────────┘
```

## 🔄 Flujo de Datos

### 1. Carga de Archivo

```
Usuario arrastra archivo
    ↓
FileDropzone detecta archivo
    ↓
createFileInfo() extrae metadatos
    ↓
storeFile() guarda en memoria
    ↓
sessionStorage guarda metadatos
    ↓
Router navega a /editor
```

### 2. Vista del Editor

```
EditorContent lee sessionStorage
    ↓
getFile() recupera archivo del store
    ↓
createFilePreviewUrl() crea URL de preview
    ↓
FilePreview muestra preview
    ↓
ActionSidebar muestra acciones disponibles
```

### 3. Procesamiento de Archivo

```
Usuario selecciona acción
    ↓
handleActionSelect() maneja la acción
    ↓
Verifica tamaño del archivo
    ↓
< 10MB: Procesamiento local (futuro)
> 10MB: Upload encriptado (futuro)
    ↓
Muestra toast con progreso
    ↓
Descarga resultado
```

## 🗂️ Gestión de Estado

### Client State

- **React Hooks**: useState, useEffect, useMemo para estado local
- **File Store**: Map en memoria para archivos cargados
- **Session Storage**: Metadatos de archivos entre navegaciones

### No se usa estado global porque:

- La app tiene flujo lineal (carga → edición → conversión)
- No hay múltiples archivos simultáneos
- No hay estado compartido complejo

## 📦 Módulos Principales

### `/lib/file-utils.ts`

Utilidades para trabajar con archivos:

- `createFileInfo()`: Crea objeto FileInfo con metadatos
- `formatFileSize()`: Formatea bytes a KB/MB/GB
- `getCategoryLabel()`: Obtiene etiqueta legible de categoría
- `isLargeFile()`: Verifica si archivo es >10MB

### `/lib/file-store.ts`

Store en memoria para archivos:

- `storeFile()`: Guarda archivo en Map
- `getFile()`: Recupera archivo del Map
- `createFilePreviewUrl()`: Crea URL de objeto para preview
- `revokeFilePreviewUrl()`: Limpia URL de objeto

### `/lib/file-actions.ts`

Configuración data-driven de acciones:

- Define acciones disponibles por categoría
- Formatos de conversión disponibles
- Iconos y labels para cada acción

### `/lib/nav-config.ts`

Configuración de navegación del header:

- Menús por categoría de archivo
- Herramientas disponibles
- Rutas y enlaces

## 🎨 Sistema de Temas

### Implementación

```css
/* globals.css */
:root {
  /* Light theme */
}
.dark {
  /* Dark theme */
}
.blue {
  /* Blue theme */
}
```

### Paleta Blue

```css
--primary: #3584e4;
--primary-foreground: #ffffff;
--background: #0b1a2e;
--foreground: #d7e6fa;
/* ... más variables */
```

### Provider

```tsx
<ThemeProvider
  attribute="class"
  defaultTheme="system"
  themes={["light", "dark", "blue"]}
>
```

## 🎯 Tipos de Archivo

### FileCategory

```typescript
type FileCategory = "document" | "image" | "video" | "audio" | "unknown";
```

### FileInfo

```typescript
interface FileInfo {
  id: string;
  name: string;
  size: number;
  type: string;
  extension: string;
  category: FileCategory;
  file: File;
  previewUrl?: string;
  state: FileState;
}
```

### FileState

```typescript
type FileState =
  | "idle"
  | "selected"
  | "uploading"
  | "queued"
  | "processing"
  | "completed"
  | "error";
```

## 🔌 Integraciones Futuras

### Backend API (Planeado)

- Endpoint para conversión de archivos grandes
- Upload con chunks para archivos pesados
- Procesamiento serverless
- Encriptación end-to-end

### WebAssembly (Planeado)

- FFmpeg.wasm para conversión de video/audio local
- Sharp/ImageMagick para procesamiento de imágenes
- PDF.js para manipulación de PDFs

## 🔒 Consideraciones de Seguridad

### Validación de Archivos

- Verificación de extensiones permitidas
- Validación de MIME types
- Límites de tamaño de archivo
- Sanitización de nombres de archivo

### Privacidad

- Archivos no se almacenan en servidor
- Procesamiento local cuando es posible
- URLs de preview son temporales
- Limpieza de memoria después de procesamiento

## 🚀 Performance

### Optimizaciones Implementadas

- Lazy loading de componentes del editor
- Preview URLs creadas solo cuando se necesitan
- Suspense boundaries para carga asíncrona
- Turbopack para builds rápidos

### Optimizaciones Futuras

- Web Workers para procesamiento pesado
- Streaming de archivos grandes
- Compresión de assets
- Service Workers para caching

## 📊 Métricas y Analytics

- Vercel Analytics integrado
- Tracking de conversiones exitosas/fallidas
- Monitoreo de performance
- Error tracking

## 🧪 Testing (Planeado)

### Unit Tests

- Vitest para testing de utilidades
- Testing Library para componentes

### E2E Tests

- Playwright para flujos completos
- Tests de drag & drop
- Tests de conversión

### Integration Tests

- Tests de API cuando se implemente backend
- Tests de upload de archivos
