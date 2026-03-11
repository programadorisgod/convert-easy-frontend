# Guía Rápida para Desarrolladores

## 🚀 Inicio Rápido

```bash
# Clonar repositorio
git clone [url-del-repo]
cd conver-easy-frontend

# Instalar dependencias
pnpm install

# Iniciar desarrollo
pnpm dev

# Abrir en navegador
# http://localhost:3000
```

## 📁 Estructura de Archivos

```
app/
├── page.tsx              # Home con drag & drop
├── layout.tsx            # Layout raíz
└── editor/
    └── page.tsx          # Vista del editor

components/
├── file-dropzone.tsx     # Componente principal de carga
├── header.tsx            # Header de la app
├── theme-toggle.tsx      # Toggle de temas
├── editor/               # Componentes del editor
│   ├── action-sidebar.tsx
│   └── file-preview.tsx
└── ui/                   # shadcn/ui components

lib/
├── file-utils.ts         # Utilidades de archivos
├── file-store.ts         # Store en memoria
├── file-actions.ts       # Acciones por categoría
└── utils.ts              # Utilidades generales
```

## 🎨 Agregar un Nuevo Tema

1. Editar `app/globals.css`:
```css
.tu-tema {
  --background: hsl(...);
  --foreground: hsl(...);
  /* ... más variables */
}
```

2. Actualizar `components/theme-provider.tsx`:
```tsx
themes={["light", "dark", "blue", "tu-tema"]}
```

3. Actualizar `components/theme-toggle.tsx`:
```tsx
<DropdownMenuItem onClick={() => setTheme("tu-tema")}>
  <TuIcono className="mr-2 size-4" />
  Tu Tema
</DropdownMenuItem>
```

## 🔧 Agregar Nueva Acción

1. Editar `lib/file-actions.ts`:
```typescript
export const FILE_ACTIONS = {
  tuCategoria: [
    {
      id: "tu-accion",
      label: "Tu Acción",
      icon: TuIcono,
      description: "Descripción de la acción"
    },
    // ... más acciones
  ]
}
```

2. Manejar en `components/editor/action-sidebar.tsx`:
```typescript
const handleActionClick = (actionId: string) => {
  if (actionId === "tu-accion") {
    // Lógica de tu acción
    sileo.info({
      title: "Tu Acción",
      description: "Ejecutando acción..."
    })
  }
}
```

## 📦 Agregar Nuevo Tipo de Archivo

1. Actualizar tipos en `types/file.ts`:
```typescript
export type FileCategory = 
  | "document" 
  | "image" 
  | "video" 
  | "audio"
  | "tu-tipo"  // ← Nuevo
  | "unknown"
```

2. Agregar mapeo en `lib/file-utils.ts`:
```typescript
const extensionToCategory: Record<string, FileCategory> = {
  // ... existentes
  ".tu-ext": "tu-tipo",
}
```

3. Agregar icono en componentes:
```typescript
const CATEGORY_ICONS: Record<FileCategory, ElementType> = {
  // ... existentes
  "tu-tipo": TuIcono,
}
```

4. Agregar etiqueta en `lib/file-utils.ts`:
```typescript
export function getCategoryLabel(category: FileCategory): string {
  const labels: Record<FileCategory, string> = {
    // ... existentes
    "tu-tipo": "Tu Tipo",
  }
  return labels[category]
}
```

## 🎯 Crear Nuevo Componente

```tsx
// components/tu-componente.tsx
"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"

interface TuComponenteProps {
  prop1: string
  prop2?: number
  className?: string
}

export function TuComponente({ 
  prop1, 
  prop2 = 0, 
  className 
}: TuComponenteProps) {
  const [state, setState] = useState(0)
  
  return (
    <div className={cn("default-classes", className)}>
      {/* JSX */}
    </div>
  )
}
```

## 🔔 Usar Toasts

```tsx
import { sileo } from "sileo"
import { Check, AlertCircle, Info } from "lucide-react"

// Success
sileo.success({
  title: "Éxito",
  description: "Operación completada",
  icon: <Check className="size-3.5" />,
  roundness: 16,
  styles: {
    description: "text-foreground/75!",
  },
  duration: 4000,
})

// Error
sileo.error({
  title: "Error",
  description: "Algo salió mal",
  icon: <AlertCircle className="size-3.5" />,
  // ... mismas opciones
})

// Info
sileo.info({
  title: "Info",
  description: "Nota importante",
  icon: <Info className="size-3.5" />,
  // ... mismas opciones
})
```

## 📝 Trabajar con Archivos

### Cargar Archivo
```tsx
import { createFileInfo } from "@/lib/file-utils"
import { storeFile } from "@/lib/file-store"

const handleFile = (file: File) => {
  // Crear info
  const fileInfo = createFileInfo(file)
  
  // Guardar en store
  storeFile(fileInfo.id, file)
  
  // Usar fileInfo...
}
```

### Crear Preview
```tsx
import { getFile, createFilePreviewUrl } from "@/lib/file-store"

const previewUrl = useMemo(() => {
  const file = getFile(fileId)
  if (!file) return undefined
  
  if (["image", "video", "audio"].includes(category)) {
    return createFilePreviewUrl(file)
  }
  return undefined
}, [fileId, category])

// Limpiar al desmontar
useEffect(() => {
  return () => {
    if (previewUrl) {
      revokeFilePreviewUrl(previewUrl)
    }
  }
}, [previewUrl])
```

## 🎨 Estilos con Tailwind

```tsx
// Usar cn() para combinar clases
import { cn } from "@/lib/utils"

<div className={cn(
  "base-classes",
  condition && "conditional-classes",
  variant === "primary" && "variant-classes",
  className // Props del usuario
)}>
```

## 🔍 Debugging

### Ver Estado de Archivo
```tsx
console.log('FileInfo:', fileInfo)
console.log('Archivo en store:', getFile(fileInfo.id))
console.log('Session storage:', sessionStorage.getItem("pendingFile"))
```

### Ver Preview URL
```tsx
console.log('Preview URL:', previewUrl)
```

### Ver Acciones Disponibles
```tsx
import { getActionsForCategory } from "@/lib/file-actions"

console.log('Acciones:', getActionsForCategory("document"))
```

## 🧪 Testing (Futuro)

```tsx
// tests/components/file-dropzone.test.tsx
import { render, screen } from "@testing-library/react"
import { FileDropzone } from "@/components/file-dropzone"

describe("FileDropzone", () => {
  it("renders drag zone", () => {
    render(<FileDropzone />)
    expect(screen.getByText(/drag your file/i)).toBeInTheDocument()
  })
})
```

## 📚 Comandos Útiles

```bash
# Desarrollo
pnpm dev              # Iniciar servidor
pnpm build            # Build de producción
pnpm start            # Servidor de producción
pnpm lint             # Linting

# Componentes shadcn/ui
pnpm dlx shadcn@latest add button     # Agregar componente
pnpm dlx shadcn@latest add dialog     # Agregar otro

# Ver puerto ocupado (si falla dev)
lsof -i :3000         # Ver qué usa el puerto
kill -9 [PID]         # Matar proceso
```

## 🐛 Problemas Comunes

### Puerto 3000 ocupado
```bash
# Cambiar puerto
PORT=3001 pnpm dev
```

### Error de TypeScript
```bash
# Limpiar cache
rm -rf .next
pnpm dev
```

### Componente no se actualiza
- Verifica que tenga `"use client"` si usa hooks
- Revisa que las props cambien de referencia
- Usa React DevTools para inspeccionar

### Preview URL no funciona
- Verifica que el archivo esté en el store
- Asegúrate de no haber revocado la URL
- Revisa la categoría del archivo

## 📖 Recursos

- [Next.js Docs](https://nextjs.org/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [shadcn/ui](https://ui.shadcn.com)
- [Radix UI](https://www.radix-ui.com)
- [Sileo](https://sileo.aaryan.design)
- [Lucide Icons](https://lucide.dev)

## 🤝 Workflow

1. **Feature nueva**: Crear branch `feature/nombre`
2. **Implementar**: Código + Tests (futuro)
3. **Documentar**: Actualizar docs si es necesario
4. **Build**: Verificar que `pnpm build` funcione
5. **Changelog**: Actualizar CHANGELOG.md
6. **Commit**: Mensaje descriptivo
7. **PR**: Pull request a `main`

## 💡 Tips

- Usa TypeScript strict
- Siempre tipea props
- Usa `cn()` para clases condicionales
- Testea en mobile y desktop
- Verifica accesibilidad
- Mantén componentes pequeños
- Extrae lógica a hooks personalizados
- Documenta código complejo
- Actualiza docs con cambios grandes
