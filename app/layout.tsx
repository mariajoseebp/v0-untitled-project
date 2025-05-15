import type React from "react"
export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}

export const metadata = {
  title: "Proxmox Data Center Visualizer",
  description: "Simplified version for debugging",
    generator: 'v0.dev'
}


import './globals.css'