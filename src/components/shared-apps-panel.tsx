
"use client";

import React, { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { XCircle, Loader, RefreshCw, Info, AppWindow, Terminal } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Container, SharedApp } from "@/lib/types";
import { unshareApp } from "@/lib/distrobox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface SharedAppsPanelProps {
    container: Container;
    sharedApps: SharedApp[];
    onAppUnshared: () => void;
}

export function SharedAppsPanel({ container, sharedApps, onAppUnshared }: SharedAppsPanelProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isUnsharing, setIsUnsharing] = useState<string | null>(null);
  const [showBinaries, setShowBinaries] = useState(false);

  const filteredApps = useMemo(() => {
    if (showBinaries) {
      return sharedApps;
    }
    return sharedApps.filter(app => app.type === 'app');
  }, [sharedApps, showBinaries]);

  const handleUnshare = async (app: SharedApp) => {
    setIsUnsharing(app.id);
    toast({
        title: "Unsharing Application...",
        description: `Request sent to unshare "${app.name}".`,
    });
    try {
        const options = { containerName: container.name, appName: app.name, type: app.type };
        await unshareApp(options);
        toast({
            title: "Unshare Successful",
            description: `"${app.name}" has been unshared from the host.`,
        });
        onAppUnshared();
    } catch(error: any) {
        toast({
        variant: "destructive",
        title: "Unshare Failed",
        description: error.message,
        });
    } finally {
        setIsUnsharing(null);
    }
  }

  const handleRefresh = async () => {
      setIsLoading(true);
      await onAppUnshared();
      setIsLoading(false);
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between">
        <div>
            <CardTitle className="font-headline">Shared Items from {container.name}</CardTitle>
            <CardDescription>
            Applications and binaries from this container available on the host.
            </CardDescription>
        </div>
        <Button variant="outline" size="icon" onClick={handleRefresh} disabled={isLoading} className="flex-shrink-0">
            {isLoading ? <Loader className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
        </Button>
      </CardHeader>
      <CardContent>
        <div className="flex items-center space-x-2 mb-4">
            <Checkbox id="show-binaries" checked={showBinaries} onCheckedChange={(checked) => setShowBinaries(!!checked)} />
            <Label htmlFor="show-binaries" className="text-sm font-normal text-muted-foreground whitespace-nowrap cursor-pointer">Show exported binaries</Label>
        </div>
        <ScrollArea className="h-[270px] border rounded-lg p-2">
            <div className="space-y-2">
                {isLoading && sharedApps.length === 0 ? (
                    <div className="flex items-center justify-center h-24 gap-2 text-muted-foreground">
                        <Loader className="h-6 w-6 animate-spin" />
                        <span>Loading shared items...</span>
                    </div>
                ) : filteredApps.length > 0 ? (
                    filteredApps.map((app) => (
                        <div key={app.id} className="p-2 pr-3 border rounded-lg flex items-center justify-between hover:bg-accent/50 bg-background/50">
                            <div className="flex items-center gap-3">
                                {app.type === 'app' ? <AppWindow className="h-5 w-5 text-primary" /> : <Terminal className="h-5 w-5 text-muted-foreground" />}
                               <span className="font-medium">{app.name}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-7 w-7">
                                                <Info className="h-4 w-4" />
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p className="font-mono text-xs">{app.binaryPath}</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                                <Button 
                                    variant="destructive" 
                                    size="sm" 
                                    onClick={() => handleUnshare(app)}
                                    disabled={!!isUnsharing}
                                >
                                    {isUnsharing === app.id ? <Loader className="mr-2 h-4 w-4 animate-spin" /> : <XCircle className="mr-2 h-4 w-4" />}
                                    Unshare
                                </Button>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                        No {showBinaries ? 'items' : 'applications'} shared from {container.name}.
                    </div>
                )}
            </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
