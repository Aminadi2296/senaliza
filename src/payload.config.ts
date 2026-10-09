import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { s3Storage } from '@payloadcms/storage-s3'
import { seoPlugin } from '@payloadcms/plugin-seo'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

import { Users } from './collections/Users'
import { Media } from './collections/Media'
import { Categories } from './collections/Categories'
import { Products } from './collections/Products'
import { Orders } from './collections/Orders'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  serverURL: process.env.NEXT_PUBLIC_SITE_URL,
  admin: {
    user: Users.slug,
    importMap: { baseDir: path.resolve(dirname) },
    meta: { titleSuffix: ' — Señaliza Admin' },
  },
  localization: false,
  i18n: { fallbackLanguage: 'es' },
  collections: [Products, Categories, Orders, Media, Users],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: { outputFile: path.resolve(dirname, 'payload-types.ts') },
  db: postgresAdapter({
    pool: { connectionString: process.env.DATABASE_URL || '' },
  }),
  sharp,
  plugins: [
    // Imágenes en Cloudflare R2 (API compatible con S3)
    s3Storage({
      enabled: Boolean(process.env.R2_BUCKET),
      collections: {
        media: { prefix: 'media', generateFileURL: ({ filename, prefix }) => `${process.env.R2_PUBLIC_URL}/${prefix}/${filename}` },
      },
      bucket: process.env.R2_BUCKET || '',
      config: {
        region: 'auto',
        endpoint: process.env.R2_ENDPOINT,
        credentials: {
          accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
          secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
        },
      },
    }),
    // Campos SEO (título, descripción, imagen) en productos y categorías
    seoPlugin({
      collections: ['products', 'categories'],
      uploadsCollection: 'media',
      generateTitle: ({ doc }) => `${doc?.title ?? doc?.name} | Señaliza`,
      generateDescription: ({ doc }) => doc?.shortDescription ?? doc?.description ?? '',
    }),
  ],
})
