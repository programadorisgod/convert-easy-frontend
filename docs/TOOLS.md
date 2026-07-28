# Conversiones y Herramientas

## 🔄 Conversiones (`/convert/[slug]`)

Configuradas en `lib/conversion-config.ts` → `CONVERSION_CONFIGS`.

### Documentos

| Slug | Label | Source Formats | Target | Ruta |
|------|-------|---------------|--------|------|
| `docx-to-pdf` | DOCX to PDF | .docx, .doc | pdf | `/convert/docx-to-pdf` |
| `docx-to-html` | DOCX to HTML | .docx, .doc | html | `/convert/docx-to-html` |
| `docx-to-md` | DOCX to Markdown | .docx, .doc | md | `/convert/docx-to-md` |
| `docx-to-odt` | DOCX to ODT | .docx, .doc | odt | `/convert/docx-to-odt` |
| `pdf` | Convert PDF | .pdf | multiple | `/convert/pdf` |

### Video

| Slug | Label | Source Formats | Target | Ruta |
|------|-------|---------------|--------|------|
| `video-to-mp4` | Convert to MP4 | .mp4, .avi, .mov, .mkv, .webm | mp4 | `/convert/video-to-mp4` |
| `video-to-mkv` | Convert to MKV | .mp4, .avi, .mov, .webm | mkv | `/convert/video-to-mkv` |
| `video-to-webm` | Convert to WebM | .mp4, .avi, .mov, .mkv | webm | `/convert/video-to-webm` |

### Audio

| Slug | Label | Source Formats | Target | Ruta |
|------|-------|---------------|--------|------|
| `audio-to-mp3` | Convert to MP3 | .mp3, .wav, .flac, .aac, .ogg, .m4a | mp3 | `/convert/audio-to-mp3` |
| `audio-to-flac` | Convert to FLAC | .mp3, .wav, .aac, .ogg, .m4a | flac | `/convert/audio-to-flac` |
| `audio-to-wav` | Convert to WAV | .mp3, .flac, .aac, .ogg, .m4a | wav | `/convert/audio-to-wav` |

---

## 🛠️ Herramientas (`/tools/[slug]`)

Configuradas en `lib/conversion-config.ts` → `TOOL_CONFIGS`.

### Documentos (PDF)

| Slug | Label | Descripción | Operation | Ruta |
|------|-------|-------------|-----------|------|
| `pdf-organize` | Organize PDF | Merge, split, or reorder pages | organize | `/tools/pdf-organize` |
| `pdf-sign` | Sign PDF | Add digital signature | sign | `/tools/pdf-sign` |
| `pdf-protect` | Protect PDF | Add password protection | encrypt | `/tools/pdf-protect` |
| `pdf-compress` | Compress PDF | Reduce PDF file size | compress | `/tools/pdf-compress` |

### Video

| Slug | Label | Descripción | Operation | Output | Ruta |
|------|-------|-------------|-----------|--------|------|
| `extract-audio` | Extract Audio | Extract audio track from video | extract-audio | mp3 | `/tools/extract-audio` |
| `trim-video` | Trim Video | Cut and trim video segments | trim | mp4 | `/tools/trim-video` |

### Audio

| Slug | Label | Descripción | Operation | Output | Ruta |
|------|-------|-------------|-----------|--------|------|
| `trim-audio` | Trim Audio | Cut and trim audio segments | trim | mp3 | `/tools/trim-audio` |
| `normalize-audio` | Normalize Audio | Normalize audio levels | normalize | mp3 | `/tools/normalize-audio` |

---

## 📋 Operaciones de PDF

Las siguientes operaciones están disponibles vía `POST /api/v1/process/pdf/{operation}`:

| Operación | Descripción |
|-----------|-------------|
| `merge` | Unir múltiples PDFs |
| `split-range` | Dividir por rango de páginas |
| `extract-pages` | Extraer páginas específicas |
| `delete-pages` | Eliminar páginas |
| `rotate` | Rotar páginas |
| `metadata` | Editar metadatos |
| `encrypt` | Agregar contraseña |
| `decrypt` | Quitar contraseña |
| `add-text` | Agregar texto |
| `add-image` | Agregar imagen |
| `draw-rectangle` | Dibujar rectángulo |
| `add-annotation` | Agregar anotación |
| `set-mediabox` | Configurar media box |
| `compress` | Comprimir PDF |
| `extract-audio` | Extraer audio de PDF |
| `trim` | Recortar |
| `normalize` | Normalizar |
| `sign` | Firmar digitalmente |

---

## 🖼️ Procesamiento de Imágenes

Operaciones disponibles vía `POST /api/v1/process/*`:

| Operación | Endpoint | Descripción |
|-----------|----------|-------------|
| `remove-background` | `/process/remove-background` | Remover fondo con IA |
| `compress` | `/process/compress` | Comprimir imagen |
| `watermark` | `/process/watermark` | Agregar marca de agua (texto o logo) |

---

## 🔊 Procesamiento de Audio

| Operación | Endpoint | Descripción |
|-----------|----------|-------------|
| `audio` | `/process/audio` | Conversión/trim/normalize de audio |

---

## 🎬 Procesamiento de Video

| Operación | Endpoint | Descripción |
|-----------|----------|-------------|
| `video` | `/process/video` | Conversión/trim de video |

---

## 📄 Conversión XML

| Operación | Endpoint | Opciones |
|-----------|----------|----------|
| `xml/json` | `/convert/xml/json` | `preserve_attributes`, `always_as_list` |
| `xml/yaml` | `/convert/xml/yaml` | `indent`, `flow_style`, `preserve_xml_declaration` |
| `xml/html` | `/convert/xml/html` | `template` (table/list/cards), `title`, `custom_xslt` |
| `xml/csv` | `/convert/xml/csv` | `root_element`, `columns`, `delimiter` |
