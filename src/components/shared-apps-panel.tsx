
"use client";

import React, { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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
            <CardTitle className="font-headline">Shared Apps from {container.name}</CardTitle>
            <CardDescription>
            Applications and binaries from this container available on the host.
            </CardDescription>
        </div>
        <div className="flex items-center gap-2 pt-1">
            <div className="flex items-center space-x-2">
                <Checkbox id="show-binaries" checked={showBinaries} onCheckedChange={(checked) => setShowBinaries(!!checked)} />
                <Label htmlFor="show-binaries" className="text-sm font-normal text-muted-foreground whitespace-nowrap">Show Binaries</Label>
            </div>
            <Button variant="outline" size="icon" onClick={handleRefresh} disabled={isLoading}>
                {isLoading ? <Loader className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            </Button>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[300px] border rounded-lg">
            <Table>
            <TableHeader className="sticky top-0 bg-card z-10">
                <TableRow>
                <TableHead>Application</TableHead>
                <TableHead className="text-right w-[150px]">Action</TableHead>
                </TableRow>
            </TableHeader>
            <TooltipProvider>
            <TableBody>
                {isLoading && sharedApps.length === 0 ? (
                    <TableRow>
                        <TableCell colSpan={3} className="h-24 text-center">
                             <div className="flex items-center justify-center gap-2 text-muted-foreground">
                                <Loader className="h-6 w-6 animate-spin" />
                                <span>Loading shared apps...</span>
                            </div>
                        </TableCell>
                    </TableRow>
                ) : filteredApps.length > 0 ? (
                    filteredApps.map((app) => (
                        <TableRow key={app.id}>
                            <TableCell className="font-medium flex items-center gap-2">
                               {app.type === 'app' ? <AppWindow className="h-4 w-4 text-primary" /> : <Terminal className="h-4 w-4 text-muted-foreground" />}
                               <span>{app.name}</span>
                               <Tooltip>
                                 <TooltipTrigger asChild>
                                    <Info className="h-4 w-4 text-muted-foreground cursor-pointer" />
                                 </TooltipTrigger>
                                 <TooltipContent>
                                    <p className="font-mono">{app.binaryPath}</p>
                                 </TooltipContent>
                               </Tooltip>
                            </TableCell>
                            <TableCell className="text-right">
                            <Button 
                                variant="ghost" 
                                size="sm" 
                                className="text-red-500 hover:text-red-400 hover:bg-red-900/20" 
                                onClick={() => handleUnshare(app)}
                                disabled={!!isUnsharing}
                            >
                                {isUnsharing === app.id ? <Loader className="mr-2 h-4 w-4 animate-spin" /> : <XCircle className="mr-2 h-4 w-4" />}
                                Unshare
                            </Button>
                            </TableCell>
                        </TableRow>
                    ))
                ) : (
                    <TableRow>
                        <TableCell colSpan={3} className="h-24 text-center text-muted-foreground">
                        No applications {showBinaries ? '' : 'or binaries '}shared from {container.name}.
                        </TableCell>
                    </TableRow>
                )}
            </TableBody>
            </TooltipProvider>
            </Table>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

    