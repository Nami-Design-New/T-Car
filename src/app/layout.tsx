import type { Metadata } from 'next';
import Header from '@components/layout/Header';
import Footer from '@components/layout/Footer';
import I18nProvider from '@components/layout/I18nProvider';
import '@styles/main.scss';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
    icons: {
    icon: '../assets/images/fav.svg',
    shortcut: '../assets/images/fav.svg',
    apple: '../assets/images/fav.svg',
  },
  title: {
    default: 'T-Car | Rent the Latest Cars',
    template: '%s | T-Car',
  },
  description:
    'T-Car is a modern car rental platform that allows users to browse and rent the latest car models for business trips, family vacations, and personal transportation.',
  keywords: [
    'car rental',
    'rent a car',
    'T-Car',
    'business trip car rental',
    'family vacation car rental',
    'luxury car rental',
  ],
  openGraph: {
    title: 'T-Car | Rent the Latest Cars',
    description:
      'Browse and rent the latest car models for business trips, family vacations, and personal transportation.',
    url: siteUrl,
    siteName: 'T-Car',
    type: 'website',
    images: [
      {
        url: '/assets/images/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'T-Car - Modern Car Rental Platform',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'T-Car | Rent the Latest Cars',
    description:
      'Browse and rent the latest car models for business trips, family vacations, and personal transportation.',
    images: ['/assets/images/og-image.jpg'],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <body>
        <I18nProvider>
          <Header />
          <main>{children}</main>
          <Footer />
        </I18nProvider>
      </body>
    </html>
  );
}
