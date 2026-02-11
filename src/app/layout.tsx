
import type { Metadata } from 'next';
import { Inter, Space_Grotesk } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { Footer } from '@/components/footer';
import LightPillar from '@/components/LightPillar';
import { FirebaseClientProvider } from '@/firebase';
import SiteHeader from '@/components/SiteHeader';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space-grotesk',
  display: 'swap',
});

export const metadata: Metadata = {
  title: "Sarthak's Spectrum",
  description: 'Creative Coder & Explorer of Modern Web Experiences',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${spaceGrotesk.variable} dark`} suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://images.unsplash.com" />
        <link rel="preconnect" href="https://i.ibb.co" />
      </head>
      <body
        className='font-body antialiased'
      >
        <FirebaseClientProvider>
            <div className="fixed top-0 left-0 w-full h-screen -z-10">
              <LightPillar
                topColor="#0b66f9"
                bottomColor="#fb0909"
                intensity={1}
                rotationSpeed={0.3}
                interactive={false}
                glowAmount={0.003}
                pillarWidth={3}
                pillarHeight={0.4}
                noiseIntensity={0.5}
                pillarRotation={25}
              />
            </div>
            <SiteHeader />
            <main>{children}</main>
            <Footer />
            <Toaster />
        </FirebaseClientProvider>
      </body>
    </html>
  );
}
