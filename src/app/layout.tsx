import type { Metadata } from 'next';
import './globals.css';
import { ThemeProvider } from '@/components/theme-provider';
import PillNav from '@/components/PillNav';
import { Toaster } from '@/components/ui/toaster';
import { Footer } from '@/components/footer';
import LightPillar from '@/components/LightPillar';
import { navLinks } from '@/lib/data';

export const metadata: Metadata = {
  title: "Sarthak's Spectrum",
  description: 'Creative Coder & Explorer of Modern Web Experiences',
};

const logoUrl = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">✨</text></svg>`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Inter&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@700&display=swap" rel="stylesheet" />
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
              topColor="#4B0082"
              bottomColor="#8F00FF"
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
          <PillNav
            logo={logoUrl}
            items={navLinks}
            baseColor="hsl(var(--card))"
            pillColor="hsl(var(--primary))"
            hoveredPillTextColor="hsl(var(--primary-foreground))"
            pillTextColor="hsl(var(--primary-foreground))"
          />
          <main>{children}</main>
          <Footer />
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
