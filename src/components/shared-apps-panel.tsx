
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { MOCK_SHARED_APPS } from "@/lib/mock-data";
import { XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Container } from "@/lib/types";

interface SharedAppsPanelProps {
    container: Container;
}

export function SharedAppsPanel({ container }: SharedAppsPanelProps) {
  const { toast } = useToast();

  const handleUnshare = (appName: string) => {
    toast({
      variant: "destructive",
      title: "Unsharing Application",
      description: `"${appName}" from ${container.name} is being unshared from the host.`,
    });
  }

  // Filter mock data for demonstration
  const sharedAppsFromContainer = MOCK_SHARED_APPS.filter(app => app.container === container.name);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">Shared Apps from {container.name}</CardTitle>
        <CardDescription>
          Applications from this container that are exported to the host.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Application</TableHead>
              <TableHead>Binary Path</TableHead>
              <TableHead className="text-right w-[150px]">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sharedAppsFromContainer.length > 0 ? sharedAppsFromContainer.map((app) => (
              <TableRow key={app.id}>
                <TableCell className="font-medium">{app.name}</TableCell>
                <TableCell className="font-mono text-sm text-muted-foreground">{app.binaryPath}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => handleUnshare(app.name)}>
                    <XCircle className="mr-2 h-4 w-4" />
                    Unshare
                  </Button>
                </TableCell>
              </TableRow>
            )) : (
                 <TableRow>
                    <TableCell colSpan={3} className="h-24 text-center">
                      No applications shared from {container.name}.
                    </TableCell>
                  </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
