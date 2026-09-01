"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { LucideIcon } from "lucide-react";

interface Base64ToolLayoutProps {
  icon: LucideIcon;
  title: string;
  description: string;
  children: ReactNode;
}

export function Base64ToolLayout({
  icon: Icon,
  title,
  description,
  children,
}: Base64ToolLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto max-w-4xl px-4 py-8">
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          ← Back to home
        </Link>

        <div className="mb-8">
          <div className="mb-3 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
              <Icon className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">{title}</h1>
              <p className="text-sm text-muted-foreground">{description}</p>
            </div>
          </div>
        </div>

        {children}

        <div className="mt-8 rounded-lg border bg-muted/50 p-4">
          <h3 className="mb-2 font-medium">Quick tips:</h3>
          <ul className="space-y-1 text-sm text-muted-foreground">
            <li>El procesamiento ocurre 100% en tu navegador</li>
            <li>Tus imágenes nunca se suben a ningún servidor</li>
            <li>Files are processed securely and deleted after download</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
