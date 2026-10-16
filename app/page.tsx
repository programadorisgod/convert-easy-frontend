import Link from "next/link";
import {
  Film,
  Music,
  FileText,
  Layers,
  Lock,
  Shield,
  Zap,
  Sparkles,
  ArrowRight,
  Binary,
  FileCode,
  CheckCircle2,
  Clock,
  Scissors,
  ArrowRightLeft,
} from "lucide-react";

import { Header } from "@/components/header";
import { FileDropzone } from "@/components/file-dropzone";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const POPULAR_TOOLS = [
  {
    label: "Convert to MP4",
    sublabel: "Re-encode MP4, web streaming & CRF",
    href: "/convert/video-to-mp4",
    icon: Film,
    category: "Video",
  },
  {
    label: "DOCX to PDF",
    sublabel: "Word to universal PDF",
    href: "/convert/docx-to-pdf",
    icon: FileText,
    category: "Documentos",
  },
  {
    label: "Convert to MP3",
    sublabel: "High quality audio with bitrate control",
    href: "/convert/audio-to-mp3",
    icon: Music,
    category: "Audio",
  },
  {
    label: "Image to PDF",
    sublabel: "Combine multiple images into one PDF",
    href: "/tools/image-to-pdf",
    icon: Layers,
    category: "PDF",
  },
  {
    label: "Extract Audio",
    sublabel: "Extract audio track from video to MP3",
    href: "/tools/extract-audio",
    icon: Music,
    category: "Video",
  },
  {
    label: "Organize PDF",
    sublabel: "Merge, split, or reorder pages",
    href: "/tools/pdf-organize",
    icon: Layers,
    category: "PDF",
  },
  {
    label: "Image to Base64",
    sublabel: "Convert images to Data URI string",
    href: "/tools/image-to-base64",
    icon: Binary,
    category: "Dev Tools",
  },
  {
    label: "Base64 to Image",
    sublabel: "Decode Base64 Data URI back to image",
    href: "/tools/base64-to-image",
    icon: FileCode,
    category: "Dev Tools",
  },
  {
    label: "DOCX to Markdown",
    sublabel: "Convert Word documents to Clean MD",
    href: "/convert/docx-to-md",
    icon: FileText,
    category: "Documentos",
  },
  {
    label: "Convert to WebM",
    sublabel: "Modern web video format",
    href: "/convert/video-to-webm",
    icon: Film,
    category: "Video",
  },
  {
    label: "Convert to WAV",
    sublabel: "Lossless uncompressed audio",
    href: "/convert/audio-to-wav",
    icon: Music,
    category: "Audio",
  },
  {
    label: "Protect PDF",
    sublabel: "Add password encryption to PDF",
    href: "/tools/pdf-protect",
    icon: Lock,
    category: "PDF",
  },
];

const CAPABILITIES = [
  {
    icon: Film,
    title: "Video Transcoding & Streaming",
    description:
      "Conversión completa de video con FFmpeg. Convierte de MP4 a MP4 para optimizar con faststart (streaming web inmediato), compresión CRF inteligente, resolución, FPS, recorte y extracción de audio.",
    tags: ["MP4", "MKV", "WebM", "MOV", "AVI", "Faststart", "CRF 0-51"],
  },
  {
    icon: Music,
    title: "Audio Studio & Normalización",
    description:
      "Transforma pistas de audio con control de bitrate (128k, 192k, 320k), recorte de segmentos y normalización de volumen para podcasts y música.",
    tags: ["MP3", "WAV", "FLAC", "AAC", "OGG", "Bitrate", "Normalizar"],
  },
  {
    icon: FileText,
    title: "Documentos & Office Moderno",
    description:
      "Convierte archivos DOCX a PDF, HTML limpio, Markdown o formato libre ODT. Con motores de alta fidelidad Pandoc y LibreOffice.",
    tags: ["DOCX", "PDF", "Markdown", "HTML", "ODT"],
  },
  {
    icon: Layers,
    title: "Suite Completa de PDF",
    description:
      "Combina múltiples archivos, divide por rango de páginas, rota orientación, añade protección con contraseña, firmas digitales y combina múltiples fotos en un solo PDF.",
    tags: ["Merge", "Split", "Firmar", "Proteger", "Imagen a PDF"],
  },
  {
    icon: Binary,
    title: "Herramientas de Desarrollador & Imágenes",
    description:
      "Codificación y decodificación Base64 en el navegador sin enviar datos al servidor. Conversión de formatos web PNG, JPG, WebP y SVG.",
    tags: ["Base64 Data URI", "WebP", "PNG", "JPG", "SVG"],
  },
];

const STEPS = [
  {
    step: "01",
    title: "Selecciona o arrastra tu archivo",
    description:
      "Sube tu archivo desde cualquier dispositivo. Se procesa con un identificador temporal seguro.",
  },
  {
    step: "02",
    title: "Elige formato y parámetros",
    description:
      "Escoge tu formato destino o personaliza compresión, bitrate, resolución o corte según tus necesidades.",
  },
  {
    step: "03",
    title: "Descarga y eliminación automática",
    description:
      "Obtén tu archivo convertido al instante. Tus archivos temporales se borran de inmediato vía TTL.",
  },
];

const FAQS = [
  {
    question: "¿Puedo convertir de MP4 a MP4 para optimizar o comprimir mi video?",
    answer:
      "Sí. Convert Easy permite re-codificar videos MP4 a MP4 para aplicar compresión inteligente (CRF), normalizar a códecs universales H.264 + AAC, y aplicar la bandera faststart (moov atom al inicio), lo que permite que el video se reproduzca por streaming instantáneo en páginas web.",
  },
  {
    question: "¿Convert Easy guarda copias de mis archivos?",
    answer:
      "No. Convert Easy fue diseñado bajo el principio de privacidad absoluta. Todos los archivos se almacenan temporalmente con identificadores aleatorios UUID y se eliminan automáticamente mediante temporizadores estrictos (TTL). No creamos copias de seguridad permanentes ni registros de contenido.",
  },
  {
    question: "¿Es gratis y necesito crear una cuenta?",
    answer:
      "Es 100% gratuito. No requiere registro, ni suscripción, ni ingresar tarjeta de crédito o correo electrónico.",
  },
  {
    question: "¿Qué tipos de archivos están soportados?",
    answer:
      "Soportamos video (MP4, MKV, WebM, MOV, AVI), audio (MP3, WAV, FLAC, AAC, OGG), documentos (DOCX, PDF, Markdown, HTML, ODT), herramientas PDF avanzadas (organizar, proteger, firmar, imagen a PDF) y herramientas para desarrolladores (Base64).",
  },
  {
    question: "¿Cómo funciona la seguridad de los archivos grandes?",
    answer:
      "Los archivos grandes se transfieren de forma cifrada mediante carga segmentada de alto rendimiento y se procesan en segundo plano de manera aislada antes de su purga automática.",
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-12 md:py-16">
        {/* Hero Section */}
        <div className="mx-auto max-w-4xl text-center">
          <div className="mb-4 flex items-center justify-center h-7">
            <Badge
              variant="secondary"
              className="h-7 px-3 text-[11px] sm:text-xs font-medium whitespace-nowrap inline-flex items-center gap-1.5 shrink-0"
            >
              <Shield className="size-3.5 text-primary shrink-0" />
              <span className="hidden sm:inline">
                Privacidad Absoluta • 100% Gratuito • Sin Registro
              </span>
              <span className="sm:hidden">
                100% Privado • Gratis • Sin Registro
              </span>
            </Badge>
          </div>

          <h1 className="text-balance text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl md:text-6xl">
            Convierte tus archivos con{" "}
            <span className="text-primary">privacidad y velocidad</span>
          </h1>

          <p className="mx-auto mt-5 max-w-2xl text-pretty text-lg text-muted-foreground md:text-xl">
            Convertidor integral para video (MP4 a MP4, WebM), audio de alta calidad,
            documentos Word a PDF/Markdown y herramientas avanzadas de PDF. Sin cuentas, sin rastreo y con borrado automático.
          </p>
        </div>

        {/* Dropzone */}
        <div className="mx-auto mt-10 max-w-2xl">
          <FileDropzone />
        </div>

        {/* Trust Points */}
        <div className="mx-auto mt-10 grid max-w-4xl grid-cols-2 gap-4 text-center sm:grid-cols-4">
          <div className="rounded-xl border bg-card/50 p-4">
            <Clock className="mx-auto mb-2 size-5 text-primary" />
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Borrado TTL
            </h2>
            <p className="text-sm font-medium">Cero archivos retenidos</p>
          </div>
          <div className="rounded-xl border bg-card/50 p-4">
            <Film className="mx-auto mb-2 size-5 text-primary" />
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Web Faststart
            </h2>
            <p className="text-sm font-medium">Streaming MP4 al instante</p>
          </div>
          <div className="rounded-xl border bg-card/50 p-4">
            <Zap className="mx-auto mb-2 size-5 text-primary" />
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              FFmpeg & LibreOffice
            </h2>
            <p className="text-sm font-medium">Procesamiento profesional</p>
          </div>
          <div className="rounded-xl border bg-card/50 p-4">
            <Shield className="mx-auto mb-2 size-5 text-primary" />
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Sin Cuentas
            </h2>
            <p className="text-sm font-medium">100% anónimo y libre</p>
          </div>
        </div>

        {/* Capabilities Section */}
        <div className="mx-auto mt-24 max-w-5xl">
          <div className="text-center">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-primary">
              // Capacidades integrales
            </h2>
            <h3 className="mt-2 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Un motor completo para todos tus formatos
            </h3>
            <p className="mt-3 text-muted-foreground">
              La potencia del procesamiento profesional directamente en tu navegador.
            </p>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {CAPABILITIES.map((cap) => (
              <div
                key={cap.title}
                className="group flex flex-col justify-between rounded-2xl border bg-card/60 p-6 transition-all hover:border-primary/40 hover:shadow-lg"
              >
                <div>
                  <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    <cap.icon className="size-6" />
                  </div>
                  <h4 className="mt-5 text-lg font-semibold text-foreground">
                    {cap.title}
                  </h4>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {cap.description}
                  </p>
                </div>
                <div className="mt-6 flex flex-wrap gap-1.5 pt-4 border-t border-border/50">
                  {cap.tags.map((tag) => (
                    <Badge
                      key={tag}
                      variant="outline"
                      className="text-[11px] font-normal"
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Popular Tools / SEO Internal Linking Grid */}
        <div className="mx-auto mt-28 max-w-5xl">
          <div className="text-center">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-primary">
              // Herramientas más utilizadas
            </h2>
            <h3 className="mt-2 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Acceso directo a herramientas populares
            </h3>
            <p className="mt-3 text-muted-foreground">
              Comienza tu conversión en un solo clic con configuraciones optimizadas.
            </p>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {POPULAR_TOOLS.map((tool) => (
              <Link
                key={tool.href}
                href={tool.href}
                className="group flex flex-col justify-between rounded-xl border bg-card/40 p-4 transition-all hover:border-primary hover:bg-card hover:shadow-md"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                      <tool.icon className="size-4" />
                    </div>
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      {tool.category}
                    </span>
                  </div>
                  <h4 className="mt-3 font-semibold text-foreground group-hover:text-primary transition-colors">
                    {tool.label}
                  </h4>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {tool.sublabel}
                  </p>
                </div>
                <div className="mt-4 flex items-center gap-1 text-xs font-medium text-primary">
                  <span>Abrir conversor</span>
                  <ArrowRight className="size-3 transition-transform group-hover:translate-x-1" />
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* How It Works */}
        <div className="mx-auto mt-28 max-w-4xl">
          <div className="text-center">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-primary">
              // Proceso simple
            </h2>
            <h3 className="mt-2 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              ¿Cómo funciona Convert Easy?
            </h3>
            <p className="mt-3 text-muted-foreground">
              Tres sencillos pasos diseñados para ahorrarte tiempo y proteger tu privacidad.
            </p>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {STEPS.map((item) => (
              <div
                key={item.step}
                className="relative rounded-2xl border bg-card/40 p-6 text-center"
              >
                <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-primary/10 text-lg font-bold text-primary">
                  {item.step}
                </div>
                <h4 className="mt-4 font-semibold text-foreground">{item.title}</h4>
                <p className="mt-2 text-sm text-muted-foreground">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Privacy Comparison vs Traditional Converters */}
        <div className="mx-auto mt-28 max-w-4xl rounded-2xl border bg-card/60 p-8 md:p-12">
          <div className="text-center">
            <Badge variant="secondary" className="mb-3">
              Comparativa de Privacidad
            </Badge>
            <h3 className="text-2xl font-bold tracking-tight sm:text-3xl">
              ¿Por qué Convert Easy es diferente?
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Compara nuestro modelo de privacidad frente a otros servicios comerciales.
            </p>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-6">
              <h4 className="font-semibold text-destructive">
                Otros convertidores web
              </h4>
              <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-destructive">✕</span>
                  <span>Exigen cuentas o planes de pago para archivos medianos</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-destructive">✕</span>
                  <span>Retienen archivos en servidores por días o semanas</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-destructive">✕</span>
                  <span>Llenos de publicidad engañosa y cookies de rastreo</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-destructive">✕</span>
                  <span>Sin optimizaciones para streaming web de video</span>
                </li>
              </ul>
            </div>

            <div className="rounded-xl border border-primary/30 bg-primary/5 p-6">
              <h4 className="font-semibold text-primary">Convert Easy</h4>
              <ul className="mt-4 space-y-2 text-sm text-foreground">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="size-4 text-primary shrink-0 mt-0.5" />
                  <span>100% gratuito y sin necesidad de crear cuenta</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="size-4 text-primary shrink-0 mt-0.5" />
                  <span>Eliminación automática e inmediata con expiración TTL</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="size-4 text-primary shrink-0 mt-0.5" />
                  <span>Sin publicidad invasiva ni tracking de navegación</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="size-4 text-primary shrink-0 mt-0.5" />
                  <span>Re-codificación MP4 a MP4 con streaming progresivo</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* FAQ Accordion */}
        <div className="mx-auto mt-28 max-w-3xl">
          <div className="text-center">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-primary">
              // Preguntas frecuentes
            </h2>
            <h3 className="mt-2 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Preguntas Frecuentes (FAQ)
            </h3>
            <p className="mt-3 text-muted-foreground">
              Todo lo que necesitas saber sobre el uso y funcionamiento del servicio.
            </p>
          </div>

          <Accordion type="single" collapsible className="mt-10 w-full">
            {FAQS.map((faq, i) => (
              <AccordionItem key={i} value={`faq-${i}`}>
                <AccordionTrigger className="text-left font-medium text-foreground hover:no-underline">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-sm leading-relaxed text-muted-foreground">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-24 border-t py-12 bg-card/30">
        <div className="container mx-auto px-4">
          <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-4">
            <div>
              <div className="flex items-center gap-2 font-bold text-foreground">
                <Sparkles className="size-4 text-primary" />
                <span>Convert Easy</span>
              </div>
              <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                Convertidor de archivos enfocado en la privacidad total. Procesa video, audio, documentos y PDF sin cuentas ni almacenamiento.
              </p>
            </div>
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-foreground">
                Video & Audio
              </h4>
              <ul className="mt-3 space-y-2 text-xs text-muted-foreground">
                <li>
                  <Link href="/convert/video-to-mp4" className="hover:text-primary">
                    Convertir a MP4
                  </Link>
                </li>
                <li>
                  <Link href="/convert/video-to-webm" className="hover:text-primary">
                    Convertir a WebM
                  </Link>
                </li>
                <li>
                  <Link href="/convert/audio-to-mp3" className="hover:text-primary">
                    Convertir a MP3
                  </Link>
                </li>
                <li>
                  <Link href="/tools/extract-audio" className="hover:text-primary">
                    Extraer Audio
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-foreground">
                Documentos & PDF
              </h4>
              <ul className="mt-3 space-y-2 text-xs text-muted-foreground">
                <li>
                  <Link href="/convert/docx-to-pdf" className="hover:text-primary">
                    DOCX a PDF
                  </Link>
                </li>
                <li>
                  <Link href="/convert/docx-to-md" className="hover:text-primary">
                    DOCX a Markdown
                  </Link>
                </li>
                <li>
                  <Link href="/tools/pdf-organize" className="hover:text-primary">
                    Organizar PDF
                  </Link>
                </li>
                <li>
                  <Link href="/tools/image-to-pdf" className="hover:text-primary">
                    Imagen a PDF
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-foreground">
                Privacidad & Código
              </h4>
              <ul className="mt-3 space-y-2 text-xs text-muted-foreground">
                <li>
                  <Link href="/tools/image-to-base64" className="hover:text-primary">
                    Image a Base64
                  </Link>
                </li>
                <li>
                  <Link href="/tools/base64-to-image" className="hover:text-primary">
                    Base64 a Image
                  </Link>
                </li>
                <li>
                  <a
                    href="https://github.com/programadorisgod/convert-easy-frontend"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-primary"
                  >
                    GitHub Frontend
                  </a>
                </li>
                <li>
                  <a
                    href="https://github.com/programadorisgod/convert-easy-api"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-primary"
                  >
                    GitHub Backend
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="mt-12 border-t pt-6 text-center text-xs text-muted-foreground">
            <p>© {new Date().getFullYear()} Convert Easy. Código abierto bajo licencia MIT.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
