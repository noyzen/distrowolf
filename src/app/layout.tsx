
import type { Metadata } from 'next';
import './globals.css';
import '../../fontlogodistro/font-logos.css'; // Import the distro font logos
import { Toaster } from '@/components/ui/toaster';
import { AppShell } from '@/components/app-shell';
import { SearchProvider } from '@/hooks/use-search';
import { SidebarProvider } from '@/components/ui/sidebar';
import { SystemCheckProvider, useSystemCheck } from '@/hooks/use-system-check';
import SetupPage from '@/components/setup-wizard';
import { Loader, Shield } from 'lucide-react';
import { type ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'DistroWolf',
  description: 'A GUI for managing Distrobox containers.',
};

function AppInitializer({ children }: { children: ReactNode }) {
  "use client";
  const { dependenciesReady, checkingDependencies } = useSystemCheck();

  if (checkingDependencies) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background text-foreground">
        <div className="flex flex-col items-center gap-4">
          <Shield className="h-12 w-12 text-primary animate-pulse" />
          <h1 className="text-xl font-headline">DistroWolf</h1>
          <p className="text-muted-foreground">Checking system dependencies...</p>
          <Loader className="animate-spin" />
        </div>
      </div>
    );
  }

  if (!dependenciesReady) {
    return <SetupPage />;
  }

  return <AppShell>{children}</AppShell>;
}

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
        <SystemCheckProvider>
          <SidebarProvider>
            <SearchProvider>
              <AppInitializer>{children}</AppInitializer>
            </SearchProvider>
          </SidebarProvider>
        </SystemCheckProvider>
        <Toaster />
      </body>
    </html>
  );
}
