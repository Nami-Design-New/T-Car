import { auth } from "@/auth";
import {
  Footer,
  GuestLocationRequest,
  Header,
  LocaleNavigationGate,
} from "@/features/layout";
import { getHomeContent } from "@/features/home/queries";
import { NotificationsPushListener } from "@/features/notifications";
import { getUnreadNotificationCount } from "@/features/notifications/queries";
import { SiteLinksSync } from "@/features/settings";
import { getSiteSettings } from "@/features/settings/queries";
import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getDirection } from "@/shared/config/languages";
import { DirectionProvider } from "@/shared/ui/DirectionProvider";
import { Toaster } from "@/shared/ui/Toaster";
import NextTopLoader from "nextjs-toploader";
import localFont from "next/font/local";
import "../../styles/tailwind.css";

const expo = localFont({
  src: [
    {
      path: "../../assets/fonts/Expo-Arabic-Light.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../assets/fonts/Expo-Arabic-Medium.woff2",
      weight: "500",
      style: "normal",
    },
    {
      path: "../../assets/fonts/Expo-Arabic-SemiBold.woff2",
      weight: "600",
      style: "normal",
    },
    {
      path: "../../assets/fonts/Expo-Arabic-Bold.woff2",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-expo",
  display: "swap",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  // The favicon is app/icon.svg (Next's metadata file convention). There is no
  // social image yet: add a designed 1200x630 src/app/opengraph-image.jpg and
  // Next links it for Open Graph and X automatically.
  title: {
    default: "T-Car | Rent the Latest Cars",
    template: "%s | T-Car",
  },
  description:
    "T-Car is a modern car rental platform that allows users to browse and rent the latest car models for business trips, family vacations, and personal transportation.",
  keywords: [
    "car rental",
    "rent a car",
    "T-Car",
    "business trip car rental",
    "family vacation car rental",
    "luxury car rental",
  ],
  openGraph: {
    title: "T-Car | Rent the Latest Cars",
    description:
      "Browse and rent the latest car models for business trips, family vacations, and personal transportation.",
    url: siteUrl,
    siteName: "T-Car",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "T-Car | Rent the Latest Cars",
    description:
      "Browse and rent the latest car models for business trips, family vacations, and personal transportation.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default async function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const [{ locale }, session] = await Promise.all([params, auth()]);
  const dir = getDirection(locale);
  // Sessions start once the profile exists (after the register step).
  const signedIn = Boolean(session?.user);
  const unreadCount = signedIn ? await getUnreadNotificationCount() : 0;
  // Never throws: without the settings, the contact details and site links are hidden.
  const [site, homeContent] = await Promise.all([
    getSiteSettings(),
    getHomeContent().catch(() => null),
  ]);

  return (
    <html lang={locale} dir={dir} className={expo.variable}>
      <body className="antialiased max-lg:pb-[calc(5rem+env(safe-area-inset-bottom))]">
        <NextIntlClientProvider>
          <DirectionProvider dir={dir}>
            <SiteLinksSync links={site.links} />
            <NextTopLoader color="#1f7ffa" height={3} showSpinner={false} />
            <LocaleNavigationGate>
              {!signedIn && <GuestLocationRequest />}
              {signedIn && <NotificationsPushListener locale={locale} />}
              <Header
                hasSession={signedIn}
                signedIn={signedIn}
                unreadCount={unreadCount}
              />
              <main>{children}</main>
              <Footer
                contact={site.contact}
                links={site.links}
                siteText={homeContent?.footer.text}
              />
            </LocaleNavigationGate>
            <Toaster dir={dir} />
          </DirectionProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
