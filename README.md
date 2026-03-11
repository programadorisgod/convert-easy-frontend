# Easy Convert - Frontend

> Herramienta de conversión de archivos con enfoque en privacidad. Todo el procesamiento ocurre localmente o con uploads encriptados.

## 🚀 Stack Tecnológico

- **Framework**: Next.js 16 (App Router + Turbopack)
- **UI Components**: shadcn/ui + Radix UI
- **Styling**: Tailwind CSS
- **Notifications**: Sileo
- **Type Safety**: TypeScript
- **Package Manager**: pnpm

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

## 🔧 Instalación y Desarrollo

```bash
# Instalar dependencias
pnpm install

# Iniciar servidor de desarrollo
pnpm dev

# Build de producción
pnpm build

# Iniciar servidor de producción
pnpm start

# Linting
pnpm lint
```

## 📝 Funcionalidades Implementadas

### ✅ Core Features

- [x] Sistema de temas (Light/Dark/Blue)
- [x] Drag & drop de archivos
- [x] Detección automática de tipo de archivo
- [x] Preview de archivos (imágenes, video, audio)
- [x] Toasts con Sileo
- [x] Store en memoria para archivos
- [x] Sidebar de acciones data-driven
- [x] Responsive design

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
- Usar Sileo para notificaciones
- Incluir descripciones claras
- Para archivos >10MB, indicar que puede continuar usando la app

## 📚 Documentación Adicional

- [Arquitectura](./docs/ARCHITECTURE.md)
- [Componentes](./docs/COMPONENTS.md)
- [API de Archivos](./docs/FILE_API.md)

## 🤝 Contribución

Este es un proyecto en desarrollo activo. La documentación se actualiza continuamente.

## 📄 Licencia

[Especificar licencia]
