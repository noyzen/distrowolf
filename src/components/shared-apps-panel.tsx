
"use client";

import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { XCircle, Loader, RefreshCw, Info } from "lucide-react";
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

  const handleUnshare = async (appName: string) => {
    setIsUnsharing(appName);
    toast({
        title: "Unsharing Application...",
        description: `Request sent to unshare "${appName}". This might require a password.`,
    });
    try {
        await unshareApp({ containerName: container.name, appName });
        toast({
            title: "Unshare Successful",
            description: `"${appName}" has been unshared from the host.`,
        });
        onAppUnshared(); // Notify parent to refresh
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


  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between">
        <div>
            <CardTitle className="font-headline">Shared Apps from {container.name}</CardTitle>
            <CardDescription>
            Applications from this container that are available on the host.
            </CardDescription>
            <div className="flex items-center space-x-2 pt-4">
                <Checkbox id="show-binaries" checked={showBinaries} onCheckedChange={(checked) => setShowBinaries(!!checked)} />
                <Label htmlFor="show-binaries" className="text-sm font-normal">Show binary paths</Label>
            </div>
        </div>
        <Button variant="outline" size="icon" onClick={onAppUnshared} disabled={isLoading}>
            {isLoading ? <Loader className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
        </Button>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[300px] border rounded-lg">
            <Table>
            <TableHeader className="sticky top-0 bg-card">
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
                ) : sharedApps.length > 0 ? (
                    sharedApps.map((app) => (
                        <TableRow key={app.id}>
                            <TableCell className="font-medium flex items-center gap-2">
                               <span>{app.name}</span>
                               <Tooltip>
                                 <TooltipTrigger asChild>
                                    <Info className="h-4 w-4 text-muted-foreground cursor-pointer" />
                                 </TooltipTrigger>
                                 <TooltipContent>
                                    <p className="font-mono">{app.binaryPath}</p>
                                 </TooltipContent>
                               </Tooltip>
                               {showBinaries && <p className="text-xs text-muted-foreground font-mono truncate">{app.binaryPath}</p>}
                            </TableCell>
                            <TableCell className="text-right">
                            <Button 
                                variant="ghost" 
                                size="sm" 
                                className="text-red-500 hover:text-red-400 hover:bg-red-500/10" 
                                onClick={() => handleUnshare(app.name)}
                                disabled={!!isUnsharing}
                            >
                                {isUnsharing === app.name ? <Loader className="mr-2 h-4 w-4 animate-spin" /> : <XCircle className="mr-2 h-4 w-4" />}
                                Unshare
                            </Button>
                            </TableCell>
                        </TableRow>
                    ))
                ) : (
                    <TableRow>
                        <TableCell colSpan={3} className="h-24 text-center text-muted-foreground">
                        No applications shared from {container.name}.
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
