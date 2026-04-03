"use client";

import { useParams } from "next/navigation";
import { ToolPage } from "@/components/convert/tool-page";
import { getToolConfig } from "@/lib/conversion-config";

export default function ToolsPage() {
  const params = useParams();
  const slug = params.slug as string;

  const config = getToolConfig(slug);

  if (!config) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Tool not found</h1>
          <p className="text-muted-foreground mb-4">
            The tool &quot;{slug}&quot; does not exist.
          </p>
          <a href="/" className="text-primary hover:underline">
            Go back to home
          </a>
        </div>
      </div>
    );
  }

  return <ToolPage config={config} />;
}
