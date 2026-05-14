import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import './globals.css'
import { Footer } from '@/components/footer'

const sans = Geist({ variable: '--font-sans', subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Co27 Electives Board',
  description:
    'Trade Co27 ESADE electives with your cohort. No more refreshing eOffice during Add/Drop.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${sans.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-white text-zinc-900">
        <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6 sm:px-6 sm:py-10">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  )
}
