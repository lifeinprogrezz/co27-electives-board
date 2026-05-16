import type { Metadata } from 'next'
import { Geist, Instrument_Serif } from 'next/font/google'
import './globals.css'
import { Footer } from '@/components/footer'

const sans = Geist({
  variable: '--font-geist',
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
})

const serif = Instrument_Serif({
  variable: '--font-instrument-serif',
  weight: '400',
  style: ['normal', 'italic'],
  subsets: ['latin'],
})

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? 'https://co27electives.lifeinprogrezz.com',
  ),
  title: 'co27.electives',
  description:
    'Trade Co27 ESADE electives with your cohort. No more refreshing eOffice during Add/Drop.',
  openGraph: {
    title: 'co27.electives',
    description:
      'Post what you’re dropping. See who wants it. ESADE Co27 Add/Drop helper.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'co27.electives',
    description:
      'Post what you’re dropping. See who wants it. ESADE Co27 Add/Drop helper.',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="en"
      className={`${sans.variable} ${serif.variable} h-full antialiased`}
    >
      <body className="isolate min-h-full flex flex-col bg-background text-ink font-sans">
        <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6 sm:px-6 sm:py-10">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  )
}
