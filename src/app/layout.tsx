
import type { Metadata } from 'next';
import { Inter, Space_Grotesk } from 'next/font/google';
import './globals.css';
import PillNav from '@/components/PillNav';
import { Toaster } from '@/components/ui/toaster';
import { Footer } from '@/components/footer';
import LightPillar from '@/components/LightPillar';
import { navLinks } from '@/lib/data';
import { FirebaseClientProvider } from '@/firebase';

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

const logoUrl = `💫`;

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
            <header className='fixed top-0 left-0 z-[1000] w-full py-2 bg-background/30 backdrop-blur-sm'>
              <PillNav
                logo={logoUrl}
                items={navLinks}
                baseColor="hsl(var(--card))"
                pillColor="hsl(var(--primary))"
                hoveredPillTextColor="hsl(var(--primary))"
                pillTextColor="hsl(var(--primary-foreground))"
              />
            </header>
            <main>{children}</main>
            <Footer />
            <Toaster />
        </FirebaseClientProvider>
      </body>
    </html>
  );
}
