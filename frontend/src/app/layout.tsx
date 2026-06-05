import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AppNav } from '@/components/AppNav'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Magazine Studio',
  description: 'Travel magazine article generator',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-stone-50 text-stone-900 antialiased`}>
        <AppNav />
        {children}
      </body>
    </html>
  )
}
