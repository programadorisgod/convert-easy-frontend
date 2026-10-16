"use client"

import { Toaster } from "sileo"

export function SileoProvider() {
  return (
    <Toaster
      position="bottom-right"
      offset={16}
      options={{
        autopilot: false,
        duration: 2500,
        styles: {
          description: "text-muted-foreground!",
        },
      }}
    />
  )
}
