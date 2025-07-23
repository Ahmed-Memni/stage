import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'visualisation de log sdv renault',
  description: 'stage ete web',
  generator: 'kekw',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
