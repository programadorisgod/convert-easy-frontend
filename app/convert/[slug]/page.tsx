"use client";

import { useParams } from "next/navigation";
import { ConversionPage } from "@/components/convert/conversion-page";
import { getConversionConfig } from "@/lib/conversion-config";

export default function ConvertPage() {
  const params = useParams();
  const slug = params.slug as string;

  const config = getConversionConfig(slug);

  if (!config) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Conversion not found</h1>
          <p className="text-muted-foreground mb-4">
            The conversion type &quot;{slug}&quot; does not exist.
          </p>
          <a href="/" className="text-primary hover:underline">
            Go back to home
          </a>
        </div>
      </div>
    );
  }

  return <ConversionPage config={config} />;
}
