Resumen del Proyecto
Frontend para Easy Convert - herramienta de conversión de archivos con enfoque en privacidad. Stack: Next.js 16 + shadcn/ui + Sileo (toasts).

1. Sistema de Temas (Light / Dark / Blue)
Archivos a modificar:

app/globals.css - Añadir tema .blue con la paleta de azules proporcionada
app/layout.tsx - Integrar ThemeProvider con soporte para 3 temas
components/theme-toggle.tsx (nuevo) - Selector de tema con 3 opciones

Paleta de colores para tema Blue:
#d7e6fa (más claro) → #0b1a2e (más oscuro)
#d7e6fa, #aecef4, #86b5ef, #5d9de9, #3584e4, #2a6ab6, #204f89, #15355b, #0b1a2e

Implementación:

Usar CSS variables con clase .blue similar a .dark
El tema blue usará los azules como colores primarios/accent
next-themes ya está instalado - configurar themes: ['light', 'dark', 'blue']


2. Librería de Toasts (Sileo)
Acciones:

Instalar sileo via pnpm
Crear components/sileo-provider.tsx con <Toaster />
Integrar en app/layout.tsx

Uso:
import { sileo } from "sileo"
sileo.success({ title: "Archivo convertido" })

3. Header y Navegación
Archivos a crear:

components/header.tsx - Header principal
components/nav-menu.tsx - Menús desplegables por categoría

Estructura del Nav:
| Herramientas DOCX | Herramientas PDF | Herramientas Videos | Herramientas Audios |
Cada menú contendrá:

DOCX: Convertir a PDF, HTML, Markdown, ODT
PDF: Convertir, Organizar, Firmar, Proteger, Comprimir
Videos: Convertir MP4, MKV, AVI, WebM, Extraer Audio
Audios: Convertir MP3, FLAC, WAV, OGG

Componentes shadcn a usar:

DropdownMenu para menús desplegables
NavigationMenu alternativa si se prefiere hover


4. Home Page - Drag & Drop Zone
Archivos:

app/page.tsx - Página principal con dropzone
components/file-dropzone.tsx - Componente de arrastrar/soltar

Funcionalidad:

Zona grande de drag & drop con mensaje "Arrastra tu archivo y elige qué hacer"
Detección de tipo de archivo por extensión
Mostrar formatos de conversión disponibles según extensión detectada
Validación de tamaño (>10MB activará chunking en futuro)

Estado (State Machine):
IDLE → FILE_SELECTED → UPLOADING → QUEUED → PROCESSING → COMPLETED | ERROR

Usaremos useState con un objeto de estado bien tipado (evitamos dependencias adicionales como XState por ahora).

5. Vista de Edición con Sidebar Data-Driven
Archivos:

app/editor/page.tsx - Vista del editor
components/editor/file-preview.tsx - Previsualización del archivo
components/editor/action-sidebar.tsx - Sidebar con acciones
lib/file-actions.ts - Configuración data-driven de acciones

Patrón Data-Driven:
// lib/file-actions.ts
export const FILE_ACTIONS = {
  document: [
    { id: 'convert', label: 'Convertir', icon: FileType },
    { id: 'organize', label: 'Organizar', icon: Layers },
    { id: 'sign', label: 'Firmar', icon: PenTool },
    { id: 'protect', label: 'Proteger', icon: Lock },
    { id: 'unlock', label: 'Desbloquear', icon: Unlock },
    { id: 'compress', label: 'Comprimir', icon: Archive },
  ],
  image: [
    { id: 'compress', label: 'Comprimir', icon: Archive },
    { id: 'optimize', label: 'Optimizar', icon: Zap },
    { id: 'enhance', label: 'Mejorar', icon: Sparkles },
    { id: 'convert', label: 'Convertir', icon: FileType },
    { id: 'remove-bg', label: 'Remover fondo', icon: Eraser },
    { id: 'crop', label: 'Recortar', icon: Crop },
    { id: 'upscale', label: 'Ampliar', icon: Maximize },
    { id: 'watermark', label: 'Marca de agua', icon: Stamp },
    { id: 'blur-face', label: 'Pixelar cara', icon: User },
  ],
}
Layout del Editor:
┌─────────────────────────────────────────────────┐
│                    Header                        │
├──────────┬──────────────────────────────────────┤
│          │                                       │
│ Sidebar  │         File Preview                  │
│ Actions  │      (Document/Image view)            │
│          │                                       │
└──────────┴──────────────────────────────────────┘

Previsualización:

Documentos: Mostrar primera página o placeholder con info del archivo
Imágenes: Mostrar imagen con zoom/pan básico
Para archivos grandes: mensaje "Puedes seguir convirtiendo mientras dejamos tu documento listo"


6. Estructura de Carpetas Final
app/
├── layout.tsx          # Root layout con providers
├── page.tsx            # Home con dropzone
├── globals.css         # Temas light/dark/blue
└── editor/
    └── page.tsx        # Vista de edición

components/
├── header.tsx          # Header principal
├── nav-menu.tsx        # Navegación con dropdowns
├── theme-toggle.tsx    # Selector de tema
├── sileo-provider.tsx  # Provider de toasts
├── file-dropzone.tsx   # Zona de drag & drop
└── editor/
    ├── file-preview.tsx   # Preview de archivos
    └── action-sidebar.tsx # Sidebar data-driven

lib/
├── utils.ts            # Existente
├── file-actions.ts     # Acciones por tipo de archivo
└── file-utils.ts       # Detectar tipo, validar, etc.

types/
└── file.ts             # Tipos para archivos y estado


7. Orden de Implementación

Temas: Configurar CSS variables para light/dark/blue
Layout: Actualizar layout.tsx con ThemeProvider
Sileo: Instalar e integrar toasts
Header + Nav: Crear navegación con menús
Home + Dropzone: Página principal con drag & drop
Editor + Sidebar: Vista de edición con acciones data-driven
Preview: Previsualización básica de archivos


Notas Técnicas

No hay backend aún: El frontend preparará la estructura pero las llamadas API serán mocks/placeholders
Chunking: La lógica de archivos >10MB se implementará cuando conectemos con FastAPI
State Machine: Usaremos estado React simple, upgradeable a XState si crece la complejidad
Responsive: Diseño mobile-first, sidebar colapsable en móvil
