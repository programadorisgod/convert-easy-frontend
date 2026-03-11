import {  Zap, Lock, Globe } from "lucide-react"

import { Header } from "@/components/header"
import { FileDropzone } from "@/components/file-dropzone"

const features = [
  {
    icon: Zap,
    title: "Lightning Fast",
    description: "Optimized conversion engine for quick processing.",
  },
  {
    icon: Lock,
    title: "Secure Uploads",
    description: "End-to-end encryption for files that need server processing.",
  },
  {
    icon: Globe,
    title: "Any Format",
    description: "Support for documents, images, videos, and audio files.",
  },
]

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-12 md:py-16">
        {/* Hero Section */}
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-balance text-4xl font-bold tracking-tight text-foreground sm:text-5xl md:text-6xl">
            Convert your files with{" "}
            <span className="text-primary">privacy</span>
          </h1>
          <p className="mt-4 text-pretty text-lg text-muted-foreground md:text-xl">
            Fast, secure file conversion that respects your privacy. 
            No accounts needed, no files stored.
          </p>
        </div>

        {/* Dropzone */}
        <div className="mx-auto mt-12 max-w-2xl">
          <FileDropzone />
        </div>

        {/* Features */}
        <div className="mx-auto mt-20 max-w-4xl">
          <h2 className="text-center text-2xl font-semibold text-foreground">
            Why Easy Convert?
          </h2>
          <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="flex flex-col items-center text-center"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <feature.icon className="h-6 w-6" />
                </div>
                <h3 className="mt-4 font-semibold text-foreground">
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>Easy Convert - Privacy-first file conversion</p>
        </div>
      </footer>
    </div>
  )
}
