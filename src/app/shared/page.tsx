"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { MOCK_SHARED_APPS } from "@/lib/mock-data";
import { XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function SharedAppsPage() {
  const { toast } = useToast();

  const handleUnshare = (appName: string) => {
    toast({
      variant: "destructive",
      title: "Unsharing Application",
      description: `"${appName}" is being unshared from the host.`,
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">Shared Applications</CardTitle>
        <CardDescription>
          A list of applications exported from your containers to the host.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Application</TableHead>
              <TableHead>Source Container</TableHead>
              <TableHead>Binary Path</TableHead>
              <TableHead className="text-right w-[150px]">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {MOCK_SHARED_APPS.map((app) => (
              <TableRow key={app.id}>
                <TableCell className="font-medium">{app.name}</TableCell>
                <TableCell>{app.container}</TableCell>
                <TableCell className="font-mono text-sm text-muted-foreground">{app.binaryPath}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => handleUnshare(app.name)}>
                    <XCircle className="mr-2 h-4 w-4" />
                    Unshare
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
