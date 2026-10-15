import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // Signed-in pages redirect anonymous crawlers anyway; keep them out of the index.
      disallow: ['/api/', '/*/account', '/*/my-bookings'],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
