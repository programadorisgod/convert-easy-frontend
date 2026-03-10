"use client"

import { Toaster } from "sileo"

export function SileoProvider() {
  return (
    <Toaster
      position="bottom-right"
      toastOptions={{
        className: "font-sans",
      }}
    />
  )
}
