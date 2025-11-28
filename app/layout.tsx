import type { Metadata } from 'next';
import { Inter, Space_Grotesk } from 'next/font/google';
import '../app/globals.css';
import Script from 'next/script';
import { Providers } from '@/components/providers';
import { NavBar } from '@/components/NavBar';
import { SiteFooter } from '@/components/SiteFooter';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const space = Space_Grotesk({ subsets: ['latin'], variable: '--font-space' });

export const metadata: Metadata = {
  title: 'Imported Products | Feel-good gadgets',
  description: 'Client-first storefront powered by the Imported Products.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${space.variable} min-h-screen bg-slate-50 text-slate-900`}>
        <Providers>
          <NavBar />
          <div className="min-h-[calc(100vh-200px)]">{children}</div>
          <SiteFooter />
        </Providers>
        <Script
          src="https://unpkg.com/@dotlottie/player-component@2.7.12/dist/dotlottie-player.js"
          strategy="afterInteractive"
          type="module"
        />
      </body>
    </html>
  );
}
