import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ConversionPage } from "@/components/convert/conversion-page";
import { getConversionConfig, CONVERSION_CONFIGS } from "@/lib/conversion-config";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return Object.keys(CONVERSION_CONFIGS).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const config = getConversionConfig(slug);

  if (!config) {
    return {
      title: "Conversion Not Found",
    };
  }

  const title = `${config.label} Online Free`;
  const description = `${config.description}. Convert ${config.sourceExtensions.join(", ")} to ${config.targetFormat.toUpperCase()} fast and securely. 100% private, no sign-up.`;
  const url = `https://converteasy.astralsolutions.tech/convert/${slug}`;

  return {
    title,
    description,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title: `${title} | Convert Easy`,
      description,
      url,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | Convert Easy`,
      description,
    },
  };
}

export default async function ConvertPage({ params }: PageProps) {
  const { slug } = await params;
  const config = getConversionConfig(slug);

  if (!config) {
    notFound();
  }

  return <ConversionPage slug={slug} />;
}
