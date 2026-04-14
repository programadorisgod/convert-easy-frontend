"use client"

import { Toaster } from "sileo"

export function SileoProvider() {
  return (
    <Toaster
      position="bottom-right"
      offset={16}
      options={{
        autopilot: true,
        duration: 5000,
        styles: {
          description: "text-muted-foreground!",
        },
      }}
    />
  )
}
