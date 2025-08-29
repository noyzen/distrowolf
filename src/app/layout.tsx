
import type { Metadata } from 'next';
import './globals.css';
import '../../fontlogodistro/font-logos.css'; // Import the distro font logos
import { Toaster } from '@/components/ui/toaster';
import { AppShell } from '@/components/app-shell';
import { SearchProvider } from '@/hooks/use-search';
import { SidebarProvider } from '@/components/ui/sidebar';

export const metadata: Metadata = {
  title: 'DistroWolf',
  description: 'A GUI for managing Distrobox containers.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <meta httpEquiv="Content-Security-Policy" content="script-src 'self' 'unsafe-inline';" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-body antialiased bg-background">
        <SidebarProvider>
          <SearchProvider>
              <AppShell>{children}</AppShell>
          </SearchProvider>
        </SidebarProvider>
        <Toaster />
      </body>
    </html>
  );
}
