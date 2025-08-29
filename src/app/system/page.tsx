
"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldCheck, Github, ExternalLink, Server, Box, Info, Boxes, HardDrive, Code, Terminal, Loader } from "lucide-react";
import Link from "next/link";
import { getSystemInfo, listContainers, listLocalImages } from "@/lib/distrobox";
import type { SystemInfo } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { useSystemCheck } from "@/hooks/use-system-check";
import { Button } from "@/components/ui/button";

const InfoRow = ({ icon, label, value, children }: { icon: React.ElementType, label: string, value?: string, children?: React.ReactNode }) => (
    <div className="flex items-center justify-between p-3 rounded-lg bg-background hover:bg-accent/50 transition-colors min-h-[52px]">
      <div className="flex items-center gap-3">
        {React.createElement(icon, { className: "h-5 w-5 text-muted-foreground" })}
        <span className="font-medium">{label}</span>
      </div>
      {value !== undefined ? <span className="font-mono text-sm text-primary">{value || 'N/A'}</span> : children}
    </div>
);

const StatCard = ({ icon, label, value, loading }: { icon: React.ElementType, label: string, value: number | null, loading: boolean }) => (
    <Card className="flex-1">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{label}</CardTitle>
            {React.createElement(icon, { className: "h-4 w-4 text-muted-foreground" })}
        </CardHeader>
        <CardContent>
            {loading ? <Skeleton className="h-8 w-16" /> : (
                <div className="text-2xl font-bold">
                    {value}
                </div>
            )}
        </CardContent>
    </Card>
)

export default function SystemPage() {
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);
  const [counts, setCounts] = useState<{containers: number | null, images: number | null}>({ containers: null, images: null });
  const [loading, setLoading] = useState(true);
  const { dependencies, installWezterm, isInstallingWezterm } = useSystemCheck();

  const hasTerminal = dependencies?.weztermInstalled || !!dependencies?.detectedTerminal;

  useEffect(() => {
    const fetchInfo = async () => {
      setLoading(true);
      try {
        const infoPromise = getSystemInfo();
        const containersPromise = listContainers();
        const imagesPromise = listLocalImages();

        const [info, containers, images] = await Promise.all([infoPromise, containersPromise, imagesPromise]);
        
        setSystemInfo(info);
        setCounts({ containers: containers.length, images: images.length });

      } catch (error) {
        console.error("Failed to get system info:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchInfo();
  }, []);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <ShieldCheck className="h-6 w-6 text-primary" />
            <CardTitle className="font-headline">System Dashboard</CardTitle>
          </div>
           <CardDescription>
            An overview of your system and DistroWolf environment.
          </CardDescription>
          <div className="text-md text-primary pt-2 flex items-center gap-2">
                <Code className="h-4 w-4"/>
                <span>Forged by Noyzen in the full-vibe AI coding flames of firebase.studio.</span>
            </div>
        </CardHeader>
        <CardContent className="space-y-6">
            <div>
                <h3 className="text-lg font-semibold mb-2 text-foreground/90">DistroWolf Statistics</h3>
                <div className="grid gap-4 md:grid-cols-2">
                    <StatCard icon={Boxes} label="Total Containers" value={counts.containers} loading={loading}/>
                    <StatCard icon={HardDrive} label="Local Images" value={counts.images} loading={loading} />
                </div>
            </div>
             <div>
                <h3 className="text-lg font-semibold mb-2 text-foreground/90">Core Components</h3>
                <div className="space-y-2">
                    <InfoRow icon={Server} label="Operating System" value={systemInfo?.distro} />
                    <InfoRow icon={Box} label="Distrobox Version" value={systemInfo?.distroboxVersion} />
                    <InfoRow icon={Info} label="Podman Version" value={systemInfo?.podmanVersion} />
                    <InfoRow icon={Terminal} label="Terminal Emulator">
                       {loading ? <Skeleton className="h-5 w-24" /> : (
                            hasTerminal ? (
                                 <span className="font-mono text-sm text-primary">{dependencies?.detectedTerminal || 'WezTerm'}</span>
                            ) : (
                                <Button size="sm" onClick={installWezterm} disabled={isInstallingWezterm}>
                                    {isInstallingWezterm ? <Loader className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                                    Install WezTerm
                                </Button>
                            )
                       )}
                    </InfoRow>
                </div>
            </div>
        </CardContent>
      </Card>
      
       <Card>
        <CardHeader>
            <CardTitle className="font-headline">Project Links</CardTitle>
            <CardDescription>
                Find more information about DistroWolf and Distrobox.
            </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
            <Link href="https://distrobox.it/" target="_blank" rel="noopener noreferrer" className="block p-4 border rounded-lg hover:bg-accent/20 transition-colors">
                <div className="flex items-center gap-3">
                    <ExternalLink className="h-5 w-5 text-primary"/>
                    <div>
                        <h3 className="font-semibold">Distrobox Official Site</h3>
                        <p className="text-sm text-muted-foreground">The official documentation and website for Distrobox.</p>
                    </div>
                </div>
            </Link>
            <Link href="https://github.com/noyzey/distrowolf" target="_blank" rel="noopener noreferrer" className="block p-4 border rounded-lg hover:bg-accent/20 transition-colors">
                 <div className="flex items-center gap-3">
                    <Github className="h-5 w-5 text-primary"/>
                    <div>
                        <h3 className="font-semibold">DistroWolf on GitHub</h3>
                        <p className="text-sm text-muted-foreground">View the source code, report issues, or contribute.</p>
                    </div>
                </div>
            </Link>
        </CardContent>
      </Card>
    </div>
  );
}
