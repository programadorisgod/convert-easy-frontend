import type { FC } from "react";

export const StructuredData: FC = () => {
  const structuredData = [
    {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      name: "Convert Easy",
      url: "https://converteasy.astralsolutions.tech",
      applicationCategory: "UtilitiesApplication",
      operatingSystem: "All",
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
      },
      description:
        "Privacy-first free online file converter for video (MP4, MKV, WebM), audio (MP3, WAV, FLAC), PDF documents, Office files, and images.",
      featureList: [
        "MP4 to MP4 video transcoding, web streaming faststart optimization, CRF compression",
        "Video format conversion: MP4, MKV, MOV, WebM, AVI, trimming, audio extraction",
        "Audio conversion: MP3, WAV, FLAC, AAC, OGG, bitrate tuning, normalization",
        "Document conversion: DOCX to PDF, HTML, Markdown, ODT via Pandoc & LibreOffice",
        "PDF manipulation suite: merge, split, sign, protect, compress, image-to-pdf",
        "Developer tools: Image to Base64, Base64 to Image decoding",
        "Zero tracking, no registration, automatic TTL file deletion",
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: [
        {
          "@type": "Question",
          name: "Can I convert MP4 to MP4 to optimize or compress video?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Yes. Convert Easy supports re-encoding MP4 to MP4 with industry-standard H.264/AAC, applying CRF quality compression, and enabling faststart (+faststart) for instant progressive web streaming.",
          },
        },
        {
          "@type": "Question",
          name: "Are my files stored permanently on the server?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "No. All files are temporarily processed with random UUIDs and deleted automatically within minutes via strict TTL expiration. We never keep permanent copies or user data.",
          },
        },
        {
          "@type": "Question",
          name: "Is Convert Easy completely free?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Yes, Convert Easy is 100% free with no account creation, no subscriptions, and no hidden paywalls.",
          },
        },
        {
          "@type": "Question",
          name: "What formats can I convert?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "We support video (MP4, MKV, WebM, MOV, AVI), audio (MP3, WAV, FLAC, AAC, OGG), documents (DOCX, PDF, Markdown, HTML, ODT), and images (PNG, JPG, WebP, SVG, Base64).",
          },
        },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "HowTo",
      name: "How to Convert Files Online with Convert Easy",
      description: "Step-by-step guide to converting video, audio, documents, and images with absolute privacy.",
      step: [
        {
          "@type": "HowToStep",
          name: "Upload your file",
          text: "Drag and drop or select your file from your computer or phone. Uploads are processed with random UUIDs.",
        },
        {
          "@type": "HowToStep",
          name: "Select target format or optimization",
          text: "Choose your desired target format (e.g., MP4, MP3, PDF) or customize video quality, resolution, or bitrate.",
        },
        {
          "@type": "HowToStep",
          name: "Download and auto-cleanup",
          text: "Download your converted file immediately. The source and output files are deleted automatically.",
        },
      ],
    },
  ];

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
};
