
"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShieldCheck, Wrench, Github, ExternalLink, Server, Box, Info } from "lucide-react";
import Link from "next/link";
import { getSystemInfo } from "@/lib/distrobox";
import type { SystemInfo } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";

export default function SystemPage() {
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);

  useEffect(() => {
    const fetchInfo = async () => {
      try {
        const info = await getSystemInfo();
        setSystemInfo(info);
      } catch (error) {
        console.error("Failed to get system info:", error);
      }
    };
    fetchInfo();
  }, []);

  const handleRunDiagnostics = () => {
    alert("Running diagnostics...");
  };

  const InfoRow = ({ icon, label, value }: { icon: React.ElementType, label: string, value: string | undefined }) => (
    <div className="flex items-center justify-between p-3 rounded-lg bg-background hover:bg-accent/50 transition-colors">
      <div className="flex items-center gap-3">
        {React.createElement(icon, { className: "h-5 w-5 text-muted-foreground" })}
        <span className="font-medium">{label}</span>
      </div>
      {value ? <span className="font-mono text-sm text-primary">{value}</span> : <Skeleton className="h-5 w-24" />}
    </div>
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <ShieldCheck className="h-6 w-6 text-primary" />
            <CardTitle className="font-headline">System Information</CardTitle>
          </div>
           <CardDescription>
            Core components and versions of your Distrobox environment.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
            <InfoRow icon={Server} label="Operating System" value={systemInfo?.distro} />
            <InfoRow icon={Box} label="Distrobox Version" value={systemInfo?.distroboxVersion} />
            <InfoRow icon={Info} label="Podman Version" value={systemInfo?.podmanVersion} />
        </CardContent>
        <CardFooter>
            <Button variant="outline" onClick={handleRunDiagnostics}>
                <Wrench className="mr-2 h-4 w-4" />
                Run Diagnostics
            </Button>
        </CardFooter>
      </Card>
       <Card>
        <CardHeader>
            <CardTitle className="font-headline">Project Links</CardTitle>
            <CardDescription>
                Find more information about DistroWolf and Distrobox.
            </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
            <Link href="https://distrobox.it/" target="_blank" rel="noopener noreferrer" className="block p-4 border rounded-lg hover:bg-accent transition-colors">
                <div className="flex items-center gap-3">
                    <ExternalLink className="h-5 w-5 text-primary"/>
                    <div>
                        <h3 className="font-semibold">Distrobox Official Site</h3>
                        <p className="text-sm text-muted-foreground">The official documentation and website for Distrobox.</p>
                    </div>
                </div>
            </Link>
            <Link href="https://github.com/noyzey/distrowolf" target="_blank" rel="noopener noreferrer" className="block p-4 border rounded-lg hover:bg-accent transition-colors">
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
