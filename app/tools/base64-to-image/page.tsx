import type { Metadata } from "next";
import { FileCode } from "lucide-react";
import { Base64ToolLayout } from "@/components/convert/base64-tool-layout";
import { Base64ToImageTool } from "@/components/convert/base64-tools";

export const metadata: Metadata = {
  title: "Base64 to Image Online Free",
  description: "Decode Base64 string or Data URI back to an image (PNG, JPG, WebP) and download it immediately. 100% client-side and private.",
  alternates: {
    canonical: "https://converteasy.astralsolutions.tech/tools/base64-to-image",
  },
  openGraph: {
    title: "Base64 to Image Online Free | Convert Easy",
    description: "Decode Base64 Data URIs to images instantly and privately.",
    url: "https://converteasy.astralsolutions.tech/tools/base64-to-image",
  },
};

export default function Base64ToImagePage() {
  return (
    <Base64ToolLayout
      icon={FileCode}
      title="Base64 to Image"
      description="Decodificá un string Base64 o Data URI y volvé a obtener la imagen."
    >
      <Base64ToImageTool />
    </Base64ToolLayout>
  );
}
