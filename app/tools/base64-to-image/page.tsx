"use client";

import { FileCode } from "lucide-react";
import { Base64ToolLayout } from "@/components/convert/base64-tool-layout";
import { Base64ToImageTool } from "@/components/convert/base64-tools";

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
