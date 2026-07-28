# Convert Easy - Frontend

> Herramienta de conversión de archivos con enfoque en privacidad. Todo el procesamiento ocurre en el servidor backend con eliminación inmediata después de la descarga.

## ✨ Estado Actual

**Versión**: 0.1.0 (Release - March 11, 2026)

✅ **Conversión de Imágenes Funcional**

- Upload de archivos pequeños (<10MB) y grandes (>10MB con chunking)
- Conversión real con Convert Easy API
- Progress tracking en tiempo real
- Cancelación de conversión
- Descarga automática de resultados

## 🚀 Stack Tecnológico

- **Framework**: Next.js 16 (App Router + Turbopack)
- **UI Components**: shadcn/ui + Radix UI
- **Styling**: Tailwind CSS + tw-animate-css
- **Notifications**: Sonner
- **Validation**: Zod v4
- **Email**: Resend
- **Type Safety**: TypeScript
- **Package Manager**: pnpm
- **Backend API**: FastAPI (http://127.0.0.1:8000)

## 📁 Estructura del Proyecto

```
conver-easy-frontend/
├── app/                      # App Router de Next.js
│   ├── page.tsx             # Página principal con dropzone
│   ├── layout.tsx           # Layout raíz con providers
│   ├── globals.css          # Estilos globales y temas
│   └── editor/
│       └── page.tsx         # Vista del editor de archivos
├── components/
│   ├── file-dropzone.tsx    # Zona de drag & drop
│   ├── header.tsx           # Header principal
│   ├── theme-provider.tsx   # Provider de temas
│   ├── theme-toggle.tsx     # Selector de tema
│   ├── sileo-provider.tsx   # Provider de toasts
│   ├── editor/              # Componentes del editor
│   │   ├── action-sidebar.tsx   # Sidebar de acciones
│   │   └── file-preview.tsx     # Preview de archivos
│   └── ui/                  # Componentes shadcn/ui
├── lib/
│   ├── file-actions.ts      # Configuración de acciones por tipo
│   ├── file-ut/home/camidev/Documents/side-projects/convert-easy-suite/File Conversion Job Workflow-2026-03-09-214054.pngls.ts        # Utilidades para archivos
│   ├── file-store.ts        # Store en memoria para archivos
│   ├── nav-config.ts        # Configuración de navegación
│   └── utils.ts             # Utilidades generales
├── types/
│   └── file.ts              # Tipos TypeScript para archivos
└── public/
    └── favicon/             # Assets de iconos
```

## 🎨 Sistema de Temas

La aplicación soporta 3 temas:

- **Light**: Tema claro estándar
- **Dark**: Tema oscuro estándar
- **Blue**: Tema azul personalizado con paleta:
  - `#d7e6fa` (más claro) → `#0b1a2e` (más oscuro)

Los temas se gestionan mediante `next-themes` y CSS variables.

## ⚙️ Configuración

### Variables de Entorno

La aplicación utiliza variables de entorno para configurar la URL del backend y el servicio de email:

| Variable              | Descripción              | Valor de Desarrollo     | Valor de Producción                     |
| --------------------- | ------------------------ | ----------------------- | --------------------------------------- |
| `NEXT_PUBLIC_API_URL` | URL base del backend API | `http://127.0.0.1:8000` | `https://convert-easy-api.onrender.com` |
| `RESEND_API_KEY`      | API key de Resend        | _(requerida)_           | _(requerida)_                           |
| `RESEND_EMAIL`        | Email destino de soporte | _(requerido)_           | _(requerido)_                           |

**Archivos de configuración:**

- `.env.local` - Tu configuración local (no se sube a Git)
- `.env.example` - Plantilla de referencia con valores por defecto

Para configurar tu entorno:

```bash
# Copia el archivo de ejemplo
cp .env.example .env.local

# Edita .env.local con tus valores
# Para desarrollo local (por defecto):
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000

# Para producción:
NEXT_PUBLIC_API_URL=https://convert-easy-api.onrender.com
```

## 🔧 Instalación y Desarrollo

### Prerequisitos

1. **Backend API** debe estar corriendo:

```bash
cd ../easy_convert_api
uv run fastapi dev
# API disponible en http://127.0.0.1:8000
```

2. **Redis** debe estar corriendo:

```bash
redis-server
# o usando Docker
docker run -d -p 6379:6379 redis
```

### Frontend Setup

```bash
# Instalar dependencias
pnpm install

# Configurar variables de entorno
# Copia el archivo .env.example y renómbralo a .env.local
cp .env.example .env.local
# Luego edita .env.local con la URL correcta de tu API:
# - Desarrollo local: http://127.0.0.1:8000
# - Producción: https://convert-easy-api.onrender.com

# Iniciar servidor de desarrollo
pnpm dev
# Disponible en http://localhost:3000

# Build de producción
pnpm build

# Iniciar servidor de producción
pnpm start

# Linting
pnpm lint
```

## 🎯 Uso

### 1. Subir Archivo

- Arrastra un archivo a la zona de drop, o
- Haz clic para seleccionar un archivo

### 2. Convertir

- En el editor, haz clic en "Convert"
- Selecciona el formato de destino
- Haz clic en "Convert"
- Espera a que termine el proceso

### 3. Descargar

- Una vez completada la conversión, el botón "Download Result" se habilitará
- Haz clic para descargar el archivo convertido

### Archivos Grandes (>10MB)

- Se usa chunking automático (5MB chunks)
- El progreso se muestra en la barra
- Puedes cancelar la conversión en cualquier momento

## 📝 Funcionalidades Implementadas

### ✅ Core Features

- [x] Sistema de temas (Light/Dark/Blue)
- [x] Drag & drop de archivos
- [x] Detección automática de tipo de archivo
- [x] Preview de archivos (imágenes, video, audio)
- [x] Toasts con Sonner
- [x] Store en memoria para archivos
- [x] Sidebar de acciones data-driven
- [x] Responsive design
- [x] Soporte de contacto (Support Dialog)
  - Formulario de soporte con email + descripción + adjuntos
  - Validación con Zod v4 (sin react-hook-form por incompatibilidad)
  - Feedback visual inline (banners animados de éxito/error)
  - Rate limiting: 5 emails/día por IP (server) + localStorage (client)
  - Envío de emails vía Resend con adjuntos

### ✅ Conversión de Imágenes (Fase 1)

- [x] Upload de archivos pequeños (<10MB)
- [x] Upload chunked para archivos grandes (>10MB)
- [x] Progress tracking en tiempo real
- [x] Conversión con API backend
- [x] Polling de status automático
- [x] Cancelación de conversión
- [x] Descarga de resultados
- [x] Limpieza automática después de descarga
- [x] Formatos soportados:
  - **Input**: JPEG, PNG, WebP, AVIF, HEIC, TIFF, BMP, GIF, SVG
  - **Output**: JPEG, PNG, WebP, AVIF, HEIC, TIFF, BMP, GIF

### 🔄 En Desarrollo

- [ ] Conversión de archivos
- [ ] Compresión de archivos
- [ ] Procesamiento de imágenes
- [ ] Procesamiento de videos
- [ ] Procesamiento de audio
- [ ] Upload seguro con encriptación

## 📄 Tipos de Archivos Soportados

### Documentos

- PDF, DOCX, ODT, TXT, MD, HTML

### Imágenes

- JPG, PNG, GIF, WebP, SVG, BMP, TIFF, HEIC

### Videos

- MP4, MKV, AVI, WebM, MOV, FLV

### Audio

- MP3, WAV, FLAC, OGG, AAC, M4A

## 🔐 Privacidad

- **Procesamiento Local**: Para archivos pequeños (<10MB), todo el procesamiento ocurre en el navegador
- **Uploads Seguros**: Archivos grandes se procesan con uploads encriptados
- **Sin Almacenamiento**: Los archivos no se almacenan en servidores

## 🎯 Convenciones del Código

### Imports

- No usar `import * as React from 'react'`
- Usar imports específicos: `import { useState, useEffect } from 'react'`

### Componentes

- Usar `'use client'` para componentes interactivos
- Preferir componentes funcionales con hooks
- Usar TypeScript para todos los componentes

### Estilos

- Usar Tailwind CSS exclusivamente
- Seguir la guía de estilos de shadcn/ui
- Usar `cn()` para combinar clases

### Toasts

- Usar Sonner para notificaciones
- Incluir descripciones claras
- Para archivos >10MB, indicar que puede continuar usando la app

## 📚 Documentación Adicional

- [Arquitectura](./docs/ARCHITECTURE.md)
- [Componentes](./docs/COMPONENTS.md)
- [API de Archivos](./docs/FILE_API.md)

## 🤝 Contribución

Este es un proyecto en desarrollo activo. La documentación se actualiza continuamente.

## 📄 Licencia

[LICENSE](./LICENSE.md)
