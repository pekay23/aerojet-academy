import { MetadataRoute } from 'next'
import { getBaseUrl } from '../lib/utils/url'

export default async function robots(): Promise<MetadataRoute.Robots> {
  const baseUrl = await getBaseUrl()

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/portal/', '/staff/', '/api/'], // Block portal and API from Google
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
