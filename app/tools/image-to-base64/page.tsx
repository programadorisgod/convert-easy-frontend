"use client";

import { Binary } from "lucide-react";
import { Base64ToolLayout } from "@/components/convert/base64-tool-layout";
import { ImageToBase64Tool } from "@/components/convert/base64-tools";

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
