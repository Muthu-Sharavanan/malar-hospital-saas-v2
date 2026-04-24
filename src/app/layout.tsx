import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Malar Hospital SaaS',
  description: 'Premium Hospital Management System',
  manifest: '/manifest.json',
}

export const viewport = {
  themeColor: '#0A4D68',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css" />
      </head>
      <body>{children}</body>
    </html>
  )
}
