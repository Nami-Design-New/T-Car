import createNextIntlPlugin from 'next-intl/plugin';

/** @type {import('next').NextConfig} */

const withNextIntl = createNextIntlPlugin();
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    // License uploads allow files up to 15 MiB; leave room for multipart framing.
    serverActions: { bodySizeLimit: '16mb' },
  },

  // Real HTTP redirects, sent before any page renders (a redirect() inside a
  // streamed page only happens in the browser).
  async redirects() {
    const locale = ':locale(en|ar)';
    const section = '(?<section>profile|bookings|wallet|bank-accounts|notifications)';
    return [
      // Old tab links: /account?tab=wallet -> /account/wallet
      {
        source: `/${locale}/account`,
        has: [{ type: 'query', key: 'tab', value: section }],
        destination: '/:locale/account/:section',
        permanent: true,
      },
      { source: `/${locale}/account`, destination: '/:locale/account/profile', permanent: false },
      // Booking details moved under the account (doc 5).
      {
        source: `/${locale}/my-bookings/:id`,
        destination: '/:locale/account/bookings/:id',
        permanent: true,
      },
    ];
  },

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
};

export default withNextIntl(nextConfig);
