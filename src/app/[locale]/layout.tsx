import Footer from '@components/layout/Footer';
import Header from '@components/layout/Header';
import type { Metadata } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import '../../styles/main.css';
import localFont from 'next/font/local'


const expo = localFont({
  src: [
    {
      path: '../../assets/fonts/Expo-Arabic-light.ttf',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../../assets/fonts/Expo-Arabic-Medium.ttf',
      weight: '500',
      style: 'normal',
    },
    {
      path: '../../assets/fonts/Expo-Arabic-SemiBold.ttf',
      weight: '600',
      style: 'normal',
    }, 
    {
      path: '../../assets/fonts/Expo-Arabic-Bold.ttf',
      weight: '700',
      style: 'normal',
    }, 
   
  ], 
  variable: '--font-expo',
  display: 'swap',
})

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
    <html lang="ar" dir="rtl"    className={expo.variable}>
      <body>
         <NextIntlClientProvider>
            <Header />
               <main>{children}</main>
            <Footer />
         </NextIntlClientProvider>
      </body>
    </html>
  );
}
