import type { Metadata } from "next";
import { Binary } from "lucide-react";
import { Base64ToolLayout } from "@/components/convert/base64-tool-layout";
import { ImageToBase64Tool } from "@/components/convert/base64-tools";

export const metadata: Metadata = {
  title: "Image to Base64 Online Free",
  description: "Convert any image (PNG, JPG, SVG, WebP) to Base64 Data URI string instantly in your browser. 100% private, no server upload required.",
  alternates: {
    canonical: "https://converteasy.astralsolutions.tech/tools/image-to-base64",
  },
  openGraph: {
    title: "Image to Base64 Online Free | Convert Easy",
    description: "Convert images to Base64 Data URI strings instantly and privately.",
    url: "https://converteasy.astralsolutions.tech/tools/image-to-base64",
  },
};

export default function ImageToBase64Page() {
  return (
    <Base64ToolLayout
      icon={Binary}
      title="Image to Base64"
      description="Convierte una imagen a su representación en Base64 (Data URI)."
    >
      <ImageToBase64Tool />
    </Base64ToolLayout>
  );
}
