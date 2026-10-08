import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ToolPage } from "@/components/convert/tool-page";
import { getToolConfig, TOOL_CONFIGS } from "@/lib/conversion-config";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return Object.keys(TOOL_CONFIGS).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const config = getToolConfig(slug);

  if (!config) {
    return {
      title: "Tool Not Found",
    };
  }

  const title = `${config.label} Online Free`;
  const description = `${config.description}. Fast, secure, privacy-first processing. No files stored permanently.`;
  const url = `https://converteasy.astralsolutions.tech/tools/${slug}`;

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

export default async function ToolsPage({ params }: PageProps) {
  const { slug } = await params;
  const config = getToolConfig(slug);

  if (!config) {
    notFound();
  }

  return <ToolPage slug={slug} />;
}
