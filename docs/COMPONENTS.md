# Guía de Componentes

## 📦 Componentes Principales

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

#### Uso
```tsx
<FileDropzone
  onFileSelect={(file) => console.log('Archivo seleccionado:', file)}
  className="custom-class"
/>
```

#### Features
- Drag & drop de archivos
- Click para seleccionar archivo
- Detección automática de categoría
- Animaciones al arrastrar
- Validación de archivos
- Navegación automática al editor

#### Estados
- `isDragOver`: Cuando el usuario arrastra sobre la zona
- `selectedFile`: Archivo seleccionado actualmente

---

### FilePreview

#### Ubicación
`components/editor/file-preview.tsx`

#### Descripción
Muestra una preview del archivo cargado según su tipo.

#### Props
```typescript
interface FilePreviewProps {
  name: string
  size: number
  category: FileCategory
  extension: string
  previewUrl?: string
  isProcessing?: boolean
  className?: string
}
```

#### Uso
```tsx
<FilePreview
  name="documento.pdf"
  size={1024000}
  category="document"
  extension="pdf"
  previewUrl={previewUrl}
  isProcessing={false}
/>
```

#### Features
- Preview de imágenes con `<img>`
- Player de video con controles nativos
- Player de audio con controles nativos
- Icono con spinner cuando está procesando
- Información del archivo (nombre, tamaño, extensión)

#### Tipos de Preview
- **Imagen**: Muestra la imagen con max-height de 400px
- **Video**: Player con controles
- **Audio**: Player con controles + icono
- **Otros**: Icono de la categoría

---

### ActionSidebar

#### Ubicación
`components/editor/action-sidebar.tsx`

#### Descripción
Sidebar con acciones disponibles según el tipo de archivo.

#### Props
```typescript
interface ActionSidebarProps {
  category: FileCategory
  fileName: string
  fileSize: number
  onActionSelect?: (actionId: string, options?: Record<string, unknown>) => void
  className?: string
}
```

#### Uso
```tsx
<ActionSidebar
  category="document"
  fileName="documento.pdf"
  fileSize={1024000}
  onActionSelect={(action, options) => {
    console.log('Acción:', action, options)
  }}
/>
```

#### Features
- Muestra acciones según categoría de archivo
- Diálogo modal para conversión con selección de formato
- Toasts informativos al seleccionar acción
- Mensaje especial para archivos >10MB

#### Acciones Disponibles

**Documentos**
- Convertir (con diálogo de selección de formato)
- Comprimir
- Organizar
- Firmar
- Proteger
- Desbloquear

**Imágenes**
- Convertir
- Comprimir
- Optimizar
- Mejorar
- Remover fondo
- Recortar
- Ampliar
- Marca de agua
- Pixelar cara

**Videos**
- Convertir
- Comprimir
- Recortar
- Extraer audio
- Agregar subtítulos
- Cambiar velocidad

**Audio**
- Convertir
- Comprimir
- Recortar
- Cambiar velocidad
- Normalizar volumen
- Remover ruido

---

### Header

#### Ubicación
`components/header.tsx`

#### Descripción
Header principal de la aplicación con logo, navegación y toggle de tema.

#### Props
Sin props específicas

#### Uso
```tsx
<Header />
```

#### Features
- Logo y nombre de la app
- Toggle de tema (Light/Dark/Blue)
- Navegación responsive
- Links a herramientas por categoría

---

### ThemeToggle

#### Ubicación
`components/theme-toggle.tsx`

#### Descripción
Toggle para cambiar entre los 3 temas disponibles.

#### Props
Sin props específicas

#### Uso
```tsx
<ThemeToggle />
```

#### Features
- Selector dropdown con iconos
- Opción para seguir tema del sistema
- 3 temas: Light, Dark, Blue
- Persiste preferencia en localStorage

---

## 🎨 Componentes UI (shadcn/ui)

### Button
```tsx
import { Button } from "@/components/ui/button"

<Button variant="default" size="sm">Click me</Button>
```

**Variants**: `default`, `destructive`, `outline`, `ghost`, `link`  
**Sizes**: `default`, `sm`, `lg`, `icon`

---

### Dialog
```tsx
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

<Dialog open={open} onOpenChange={setOpen}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Título</DialogTitle>
      <DialogDescription>Descripción</DialogDescription>
    </DialogHeader>
    {/* Contenido */}
  </DialogContent>
</Dialog>
```

---

### RadioGroup
```tsx
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"

<RadioGroup value={value} onValueChange={setValue}>
  <div className="flex items-center space-x-2">
    <RadioGroupItem value="option1" id="option1" />
    <Label htmlFor="option1">Opción 1</Label>
  </div>
</RadioGroup>
```

---

### ScrollArea
```tsx
import { ScrollArea } from "@/components/ui/scroll-area"

<ScrollArea className="h-[400px]">
  {/* Contenido scrolleable */}
</ScrollArea>
```

---

### Separator
```tsx
import { Separator } from "@/components/ui/separator"

<Separator />
```

---

## 🎭 Providers

### ThemeProvider

#### Ubicación
`components/theme-provider.tsx`

#### Descripción
Provider de next-themes configurado para 3 temas.

#### Uso
```tsx
<ThemeProvider
  attribute="class"
  defaultTheme="system"
  enableSystem
  themes={["light", "dark", "blue"]}
  disableTransitionOnChange
>
  {children}
</ThemeProvider>
```

---

### SileoProvider

#### Ubicación
`components/sileo-provider.tsx`

#### Descripción
Provider de Sileo para toasts.

#### Configuración
```tsx
<Toaster
  position="bottom-right"
  theme="system"
  offset={16}
  options={{
    autopilot: true,
    duration: 5000,
    styles: {
      title: "text-foreground!",
      description: "text-foreground/75!",
    },
  }}
/>
```

#### Uso de Toasts
```tsx
import { sileo } from "sileo"

// Success toast
sileo.success({
  title: "Éxito",
  description: "Operación completada",
  icon: <CheckIcon className="size-3.5" />,
  roundness: 16,
  styles: {
    description: "text-foreground/75!",
  },
  autopilot: {
    expand: 200,
    collapse: 3000,
  },
  duration: 4000,
})

// Error toast
sileo.error({
  title: "Error",
  description: "Algo salió mal",
  icon: <AlertCircle className="size-3.5" />,
  // ... opciones similares
})

// Info toast
sileo.info({
  title: "Información",
  description: "Nota importante",
  // ... opciones similares
})
```

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

### Estados
- Usar hooks de React nativos
- useState para estado simple
- useMemo para cálculos derivados
- useCallback para funciones memorizadas

### Estilos
- Usar Tailwind CSS exclusivamente
- Usar `cn()` helper para combinar clases
- Seguir guía de estilos de shadcn/ui
- Usar variables CSS para temas

---

## 🔍 Patrones Útiles

### Componente con Suspense
```tsx
function EditorPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <EditorContent />
    </Suspense>
  )
}
```

### Componente con Error Boundary
```tsx
if (error) {
  return <ErrorState error={error} />
}
```

### Componente Condicional
```tsx
{condition && <Component />}
{condition ? <ComponentA /> : <ComponentB />}
```

### Componente con Ref
```tsx
const inputRef = useRef<HTMLInputElement>(null)

return <input ref={inputRef} />
```
