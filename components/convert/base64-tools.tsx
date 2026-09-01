"use client";

import { useRef, useState } from "react";
import {
  Upload,
  FileCode,
  Image,
  Copy,
  Check,
  Download,
  AlertCircle,
  Loader2,
  X,
  ArrowLeftRight,
} from "lucide-react";
import Link from "next/link";
import {
  fileToBase64,
  parseBase64Input,
  isValidBase64,
  decodeBase64Image,
  copyToClipboard,
  downloadText,
  downloadBytes,
  extFromMime,
} from "@/lib/base64-utils";
import { sileo } from "sileo";
import { Button } from "@/components/ui/button";
import { formatFileSize } from "@/lib/file-utils";

export function ImageToBase64Tool() {
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileSize, setFileSize] = useState<number>(0);
  const [result, setResult] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isEncoding, setIsEncoding] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    setFileName(file.name);
    setFileSize(file.size);
    setResult(null);
    setIsEncoding(true);
    try {
      const dataUri = await fileToBase64(file);
      setResult(dataUri);
    } catch {
      sileo.error({
        title: "Error al codificar",
        description: "No se pudo convertir la imagen a Base64.",
        icon: <AlertCircle className="size-3.5" />,
        roundness: 16,
        duration: 5000,
      });
    } finally {
      setIsEncoding(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer?.files?.[0];
    if (file) handleFile(file);
  };

  const handleCopy = async () => {
    if (!result) return;
    await copyToClipboard(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadTxt = () => {
    if (!result) return;
    const base = (fileName || "image").split(".").slice(0, -1).join(".") || "image";
    downloadText(result, `${base}.txt`);
  };

  return (
    <div className="mx-auto max-w-3xl">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
          e.target.value = "";
        }}
      />

      {!result && !isEncoding && (
        <div
          role="button"
          tabIndex={0}
          onClick={() => inputRef.current?.click()}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
          }}
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          className="flex min-h-64 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-muted-foreground/25 p-8 text-center transition-colors hover:border-primary/50 hover:bg-muted/50"
        >
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <Image className="h-10 w-10" />
          </div>
          <h3 className="text-xl font-semibold">Subí una imagen</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Arrastrá y soltá, o hacé clic para elegir un archivo
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {["PNG", "JPG", "WebP", "AVIF", "GIF", "BMP"].map((ext) => (
              <span
                key={ext}
                className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground"
              >
                {ext}
              </span>
            ))}
          </div>
        </div>
      )}

      {isEncoding && (
        <div className="flex min-h-64 flex-col items-center justify-center rounded-xl border bg-card">
          <Loader2 className="mb-4 h-10 w-10 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Codificando imagen...</p>
        </div>
      )}

      {result && !isEncoding && (
        <div className="space-y-4">
          <div className="flex items-start justify-between rounded-xl border bg-card p-4">
            <div>
              <p className="font-medium">{fileName}</p>
              <p className="text-sm text-muted-foreground">
                {formatFileSize(fileSize)}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setResult(null);
                setFileName(null);
              }}
            >
              <X className="h-4 w-4" />
              Cambiar imagen
            </Button>
          </div>

          <textarea
            readOnly
            value={result}
            rows={8}
            className="w-full resize-none rounded-md border bg-muted/40 p-3 font-mono text-xs text-foreground"
          />

          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={handleCopy} className="gap-2">
              {copied ? (
                <>
                  <Check className="h-4 w-4" />
                  Copiado
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  Copiar
                </>
              )}
            </Button>
            <Button onClick={downloadTxt} className="gap-2">
              <Download className="h-4 w-4" />
              Descargar .txt
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export function Base64ToImageTool() {
  const [input, setInput] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [mime, setMime] = useState<string>("image/png");
  const [decodedName, setDecodedName] = useState<string>("imagen.png");
  const [decodedBytes, setDecodedBytes] = useState<Uint8Array | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleDecode = () => {
    setError(null);
    setPreviewUrl(null);
    setDecodedBytes(null);
    if (!input.trim()) {
      setError("Pegá un string Base64 o un Data URI.");
      return;
    }
    const { payload } = parseBase64Input(input);
    if (!isValidBase64(payload)) {
      setError("El texto no parece Base64 válido.");
      return;
    }
    try {
      const { bytes, mime: resolvedMime } = decodeBase64Image(input);
      const blob = new Blob([bytes as BlobPart], { type: resolvedMime });
      setPreviewUrl(URL.createObjectURL(blob));
      setMime(resolvedMime);
      setDecodedBytes(bytes);
      setDecodedName(`imagen.${extFromMime(resolvedMime)}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo decodificar.");
    }
  };

  const downloadImg = () => {
    if (decodedBytes) downloadBytes(decodedBytes, decodedName, mime);
  };

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        rows={6}
        placeholder="Pegá acá tu Base64 o un Data URI (data:image/png;base64,...)"
        className="w-full resize-y rounded-md border bg-card p-3 font-mono text-xs text-foreground placeholder:text-muted-foreground"
      />

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {previewUrl && (
        <div className="rounded-xl border bg-card p-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-medium">{decodedName}</p>
            <Button size="sm" onClick={downloadImg} className="gap-2">
              <Download className="h-4 w-4" />
              Descargar
            </Button>
          </div>
          <div className="flex max-h-80 items-center justify-center overflow-auto rounded-lg bg-muted/40 p-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewUrl}
              alt="Vista previa decodificada"
              className="max-h-full max-w-full object-contain"
            />
          </div>
        </div>
      )}

      <Button
        onClick={handleDecode}
        disabled={!input.trim()}
        className="gap-2"
      >
        <ArrowLeftRight className="h-4 w-4" />
        Decodificar a imagen
      </Button>
    </div>
  );
}
