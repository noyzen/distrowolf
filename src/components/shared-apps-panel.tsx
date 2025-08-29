
"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { XCircle, Loader, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Container, SharedApp } from "@/lib/types";
import { listSharedApps, unshareApp } from "@/lib/distrobox";
import { ScrollArea } from "@/components/ui/scroll-area";

interface SharedAppsPanelProps {
    container: Container;
}

export function SharedAppsPanel({ container }: SharedAppsPanelProps) {
  const { toast } = useToast();
  const [sharedApps, setSharedApps] = useState<SharedApp[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUnsharing, setIsUnsharing] = useState<string | null>(null);

  const fetchSharedApps = useCallback(async () => {
    if (!container) return;
    setIsLoading(true);
    try {
        const apps = await listSharedApps(container.name);
        setSharedApps(apps);
    } catch (error: any) {
        toast({
            variant: "destructive",
            title: "Failed to load shared apps",
            description: error.message,
        });
        setSharedApps([]); // Clear on error
    } finally {
        setIsLoading(false);
    }
  }, [container.name, toast]);

  useEffect(() => {
    fetchSharedApps();
  }, [fetchSharedApps]);


  const handleUnshare = async (appName: string) => {
    setIsUnsharing(appName);
    try {
        await unshareApp({ containerName: container.name, appName });
        toast({
            title: "Unsharing Application",
            description: `"${appName}" from ${container.name} is being unshared from the host.`,
        });
        await fetchSharedApps(); // Refresh the list
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
            Applications from this container that are exported to the host.
            </CardDescription>
        </div>
        <Button variant="outline" size="icon" onClick={fetchSharedApps} disabled={isLoading}>
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
                {isLoading ? (
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
