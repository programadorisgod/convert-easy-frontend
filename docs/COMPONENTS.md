# Guía de Componentes

## 📦 Componentes de Página

### FileDropzone

#### Ubicación
`components/file-dropzone.tsx`

#### Descripción
Zona de drag & drop para cargar archivos. Detecta el tipo de archivo y navega al editor.

#### Props
```typescript
interface FileDropzoneProps {
  onFileSelect?: (file: FileInfo) => void
  className?: string
}
```

#### Features
- Drag & drop de archivos
- Click para seleccionar archivo
- Detección automática de categoría
- Animaciones al arrastrar
- Validación de archivos
- Navegación automática al editor

---

### Header

#### Ubicación
`components/header.tsx`

#### Descripción
Header principal con logo, navegación y toggle de tema.

#### Features
- Logo y nombre de la app
- Toggle de tema (Light/Dark/Blue)
- Navegación responsive
- Links a herramientas por categoría
- Botón de Support

---

### ConversionPage

#### Ubicación
`components/convert/conversion-page.tsx`

#### Descripción
Página principal de conversión. Maneja upload, progreso y descarga.

#### Props
```typescript
interface ConversionPageProps {
  config: ConversionConfig
}
```

#### Features
- Upload de archivos
- Progress tracking (upload + conversion)
- Cancelación de conversión
- Descarga de resultado
- Manejo de errores

---

### ActionExecutor

#### Ubicación
`components/convert/action-executor.tsx`

#### Descripción
Componente que ejecuta acciones de conversión y muestra progreso.

---

### ToolPage

#### Ubicación
`components/convert/tool-page.tsx`

#### Descripción
Página genérica para herramientas (PDF sign, trim, compress, etc).

#### Props
```typescript
interface ToolPageProps {
  config: ToolConfig
}
```

---

## 🎨 Componentes del Editor

### FilePreview

#### Ubicación
`components/editor/file-preview.tsx`

#### Descripción
Muestra preview del archivo según su tipo.

#### Features
- Preview de imágenes con `<img>`
- Player de video con controles nativos
- Player de audio con controles nativos
- Icono con spinner cuando está procesando
- Información del archivo (nombre, tamaño, extensión)

### ActionSidebar

#### Ubicación
`components/editor/action-sidebar.tsx`

#### Descripción
Sidebar con acciones disponibles según el tipo de archivo.

#### Features
- Muestra acciones según categoría de archivo
- Diálogo modal para conversión con selección de formato
- Toasts informativos al seleccionar acción
- Mensaje especial para archivos >10MB

### ImageCropDialog

#### Ubicación
`components/editor/image-crop-dialog.tsx`

#### Descripción
Diálogo para recortar imágenes usando `react-advanced-cropper`.

#### Features
- Recorte visual con handles
- Aspect ratio presets
- Preview del resultado

---

## 📧 Soporte

### SupportDialog

#### Ubicación
`components/support-dialog.tsx`

#### Descripción
Diálogo de soporte con email, descripción y adjuntos. Incluye validación, feedback visual y rate limiting.

#### Features
- Formulario con email, descripción y hasta 3 archivos adjuntos
- Validación manual con Zod v4 `safeParse`
- Banner de éxito (verde) con animación fade-in + slide
- Banner de error (rojo) con mensaje específico
- Rate limiting dual: client (localStorage) + server (IP), 5 emails/24h
- Warning amarillo cuando quedan ≤2 emails
- Archivos aceptados: PNG, JPG, JPEG, PDF, TXT, CSV, DOC, DOCX (max 5MB)

#### Server Action
`app/support/actions.ts` → `sendSupportEmail(formData)`

---

## ✍️ Firma de PDF

### PdfSignPage

#### Ubicación
`components/pdf-sign/pdf-sign-page.tsx`

#### Descripción
Página principal para firmar PDFs.

### PdfSignOverlay

#### Ubicación
`components/pdf-sign/pdf-sign-overlay.tsx`

#### Descripción
Overlay para colocar firmas en el PDF.

### PdfViewerWrapper

#### Ubicación
`components/pdf-sign/pdf-viewer-wrapper.tsx`

#### Descripción
Wrapper para el visor de PDFs (`@embedpdf/react-pdf-viewer`).

### SignatureCanvas

#### Ubicación
`components/signature/signature-canvas.tsx`

#### Descripción
Canvas para dibujar firmas a mano.

### TextSignature

#### Ubicación
`components/signature/text-signature.tsx`

#### Descripción
Selector de firma con texto estilizado (fuentes, colores).

### SignaturePicker

#### Ubicación
`components/signature/signature-picker.tsx`

#### Descripción
Selector entre firma dibujada o firma de texto.

---

## 🎬 Media Options

### VideoOptions

#### Ubicación
`components/video/video-options.tsx`

#### Descripción
Opciones de conversión de video (formato, calidad, etc).

### AudioOptions

#### Ubicación
`components/audio/audio-options.tsx`

#### Descripción
Opciones de conversión de audio (formato, bitrate, etc).

---

## 🎭 Providers

### ThemeProvider

#### Ubicación
`components/theme-provider.tsx`

#### Descripción
Provider de `next-themes` configurado para 3 temas.

```tsx
<ThemeProvider
  attribute="class"
  defaultTheme="system"
  enableSystem
  themes={["light", "dark", "blue"]}
  disableTransitionOnChange
>
```

### SileoProvider

#### Ubicación
`components/sileo-provider.tsx`

#### Descripción
Provider de Sonner para toasts.

```tsx
<Toaster
  position="bottom-right"
  theme="system"
  offset={16}
  duration={5000}
/>
```

---

## 🧩 Componentes UI (shadcn/ui)

Todos los componentes UI están en `components/ui/`. Los más usados:

| Componente | Uso |
|------------|-----|
| `Button` | Botones con variants (default, destructive, outline, ghost, link) |
| `Dialog` | Modales y diálogos |
| `Input` | Campos de texto |
| `Textarea` | Campos de texto multilinea |
| `Label` | Labels de formularios |
| `Select` | Dropdowns |
| `Tabs` | Navegación por tabs |
| `Card` | Contenedores con header/content/footer |
| `Progress` | Barras de progreso |
| `Tooltip` | Tooltips informativos |
| `Drawer` | Drawer mobile (vaul) |
| `Command` | Command palette (cmdk) |
| `Calendar` | Selector de fechas (react-day-picker) |
| `Chart` | Gráficos (recharts) |
| `Carousel` | Carrusel (embla-carousel) |
| `Accordion` | Acordeón expandible |
| `Alert` | Mensajes de alerta |
| `Badge` | Badges/etiquetas |
| `Checkbox` | Checkboxes |
| `Switch` | Toggle switches |
| `Slider` | Sliders de rango |
| `RadioGroup` | Grupo de radio buttons |
| `Popover` | Popovers |
| `HoverCard` | Hover cards |
| `ContextMenu` | Menús contextuales |
| `DropdownMenu` | Menús dropdown |
| `NavigationMenu` | Menús de navegación |
| `Menubar` | Barras de menú |
| `Pagination` | Paginación |
| `Skeleton` | Loading skeletons |
| `Spinner` | Spinners de carga |
| `Separator` | Separadores visuales |
| `ScrollArea` | Áreas scrolleables |
| `Resizable` | Paneles redimensionables |
| `Toggle` / `ToggleGroup` | Toggle buttons |
| `AspectRatio` | Contenedores con aspect ratio |
| `Avatar` | Avatares de usuario |
| `Breadcrumb` | Navegación breadcrumb |
| `Collapsible` | Contenido colapsable |
| `Empty` | Estado vacío |
| `Field` / `Item` / `InputGroup` / `Kbd` | Componentes de formulario avanzados |
| `Table` | Tablas de datos |
| `Toaster` / `Toast` | Toasts (radix, legacy) |
| `Sonner` | Toasts (sonner, actual) |

---

## 🎯 Convenciones de Componentes

### Naming
- PascalCase para componentes
- camelCase para funciones y variables
- UPPER_CASE para constantes

### Estructura de Archivo
```tsx
"use client" // Si es necesario

// Imports
import { useState } from "react"
import { OtherComponent } from "./other"

// Types
interface ComponentProps {
  // ...
}

// Constants
const CONSTANT_VALUE = "value"

// Component
export function Component({ prop1, prop2 }: ComponentProps) {
  // Hooks
  const [state, setState] = useState()

  // Handlers
  const handleClick = () => { }

  // Render
  return (
    <div>
      {/* JSX */}
    </div>
  )
}
```

### Props
- Siempre tipar props con TypeScript
- Usar destructuring en parámetros
- Incluir `className?: string` para personalización

### Estilos
- Usar Tailwind CSS exclusivamente
- Usar `cn()` helper para combinar clases
- Seguir guía de estilos de shadcn/ui
- Usar variables CSS para temas
- Animaciones con `tw-animate-css` (`animate-in`, `fade-in`, `slide-in-from-*`)
