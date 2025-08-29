
"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { XCircle, Loader, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Container, SharedApp } from "@/lib/types";
import { unshareApp } from "@/lib/distrobox";
import { ScrollArea } from "@/components/ui/scroll-area";

interface SharedAppsPanelProps {
    container: Container;
    sharedApps: SharedApp[];
    onAppUnshared: () => void;
}

export function SharedAppsPanel({ container, sharedApps, onAppUnshared }: SharedAppsPanelProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false); // No longer fetches its own data
  const [isUnsharing, setIsUnsharing] = useState<string | null>(null);

  const handleUnshare = async (appName: string) => {
    setIsUnsharing(appName);
    toast({
        title: "Unsharing Application...",
        description: `Request sent to unshare "${appName}" from the host.`,
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
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
            <CardTitle className="font-headline">Shared Apps from {container.name}</CardTitle>
            <CardDescription>
            Applications from this container that are available on the host.
            </CardDescription>
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
                <TableHead>Binary Path</TableHead>
                <TableHead className="text-right w-[150px]">Action</TableHead>
                </TableRow>
            </TableHeader>
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
                            <TableCell className="font-medium">{app.name}</TableCell>
                            <TableCell className="font-mono text-sm text-muted-foreground">{app.binaryPath}</TableCell>
                            <TableCell className="text-right">
                            <Button 
                                variant="ghost" 
                                size="sm" 
                                className="text-destructive hover:text-destructive hover:bg-destructive/10" 
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
            </Table>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
