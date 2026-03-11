"use client"

import { Toaster } from "sileo"

export function SileoProvider() {
  return (
    <Toaster
      position="bottom-right"
      theme="system"
      offset={16}
      options={{
        autopilot: true,
        duration: 5000,
      }}
    />
  )
}
