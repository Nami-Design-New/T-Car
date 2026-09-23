import path from 'path';
import createNextIntlPlugin from 'next-intl/plugin';

/** @type {import('next').NextConfig} */

const withNextIntl = createNextIntlPlugin();
const nextConfig = {
  reactStrictMode: true,

  sassOptions: {
    includePaths: [
      path.resolve(process.cwd(), 'node_modules'),
      path.resolve(process.cwd(), 'src/styles'),
    ],

    quietDeps: true,

    silenceDeprecations: [
      'legacy-js-api',
      'import',
      'global-builtin',
      'color-functions',
      'if-function',
    ],
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


