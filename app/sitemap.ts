import type { MetadataRoute } from "next";
import { CONVERSION_CONFIGS, TOOL_CONFIGS } from "@/lib/conversion-config";

const BASE_URL = "https://converteasy.astralsolutions.tech";

export default function sitemap(): MetadataRoute.Sitemap {
  const currentDate = new Date().toISOString();

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: currentDate,
      changeFrequency: "weekly",
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/editor`,
      lastModified: currentDate,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/tools/image-to-base64`,
      lastModified: currentDate,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/tools/base64-to-image`,
      lastModified: currentDate,
      changeFrequency: "monthly",
      priority: 0.8,
    },
  ];

  const conversionRoutes: MetadataRoute.Sitemap = Object.keys(CONVERSION_CONFIGS).map(
    (slug) => ({
      url: `${BASE_URL}/convert/${slug}`,
      lastModified: currentDate,
      changeFrequency: "weekly",
      priority: 0.8,
    })
  );

  const toolRoutes: MetadataRoute.Sitemap = Object.keys(TOOL_CONFIGS).map((slug) => ({
    url: `${BASE_URL}/tools/${slug}`,
    lastModified: currentDate,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  return [...staticRoutes, ...conversionRoutes, ...toolRoutes];
}
