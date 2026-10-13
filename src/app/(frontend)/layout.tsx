import type { Metadata } from 'next'
import { Montserrat } from 'next/font/google'
import React from 'react'
import './styles.css'
import { CartProvider } from '@/components/CartProvider'
import { Footer } from '@/components/Footer'
import { Header } from '@/components/Header'
import { JsonLd } from '@/components/JsonLd'
import { SITE } from '@/lib/config'
import { getCategoryTree } from '@/lib/data'

const montserrat = Montserrat({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-montserrat',
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: { default: `${SITE.name} | Señalética de seguridad normada en Chile`, template: `%s | ${SITE.name}` },
  description: SITE.description,
  openGraph: { siteName: SITE.name, locale: 'es_CL', type: 'website' },
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const { tree } = await getCategoryTree()
  return (
    <html lang="es-CL" className={montserrat.variable}>
      <body>
        <JsonLd data={{ '@context': 'https://schema.org', '@type': 'Organization', name: SITE.name, url: SITE.url, email: SITE.email }} />
        <CartProvider>
          <Header tree={tree} />
          <main>{children}</main>
          <Footer tree={tree} />
        </CartProvider>
      </body>
    </html>
  )
}
