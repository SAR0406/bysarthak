
import type { Metadata } from 'next';
import { Inter, Space_Grotesk, Poppins } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/components/theme-provider';
import PillNav from '@/components/PillNav';
import { Toaster } from '@/components/ui/toaster';
import { Footer } from '@/components/footer';
import LightPillar from '@/components/LightPillar';
import { navLinks } from '@/lib/data';

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

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['700'],
  variable: '--font-poppins',
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
    <html lang="en" suppressHydrationWarning className={`${inter.variable} ${spaceGrotesk.variable} ${poppins.variable}`}>
      <head>
      </head>
      <body
        className='font-body antialiased'
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
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
          <div className='fixed top-0 left-0 z-[1000] w-full py-2 bg-background/30 backdrop-blur-sm'>
            <PillNav
              logo={logoUrl}
              items={navLinks}
              baseColor="#FFFFFF"
              pillColor="#000000"
              hoveredPillTextColor="#000000"
              pillTextColor="#FFFFFF"
            />
          </div>
          <main>{children}</main>
          <Footer />
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
