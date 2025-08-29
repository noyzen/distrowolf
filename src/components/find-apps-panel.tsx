
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { MOCK_SEARCHABLE_APPS } from "@/lib/mock-data";
import { Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Container } from "@/lib/types";

interface FindAppsPanelProps {
    container: Container;
}

export function FindAppsPanel({ container }: FindAppsPanelProps) {
  const { toast } = useToast();

  const handleExport = (appName: string) => {
    toast({
      title: "Exporting Application",
      description: `"${appName}" from ${container.name} is being exported to the host.`,
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">Find Applications in {container.name}</CardTitle>
        <CardDescription>
          Search for packages and export them to your host system.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-col sm:flex-row gap-4">
            <Input placeholder="Search for applications..." className="flex-grow" />
            <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                    <Checkbox id="apt" defaultChecked />
                    <Label htmlFor="apt">apt</Label>
                </div>
                <div className="flex items-center space-x-2">
                    <Checkbox id="dnf" />
                    <Label htmlFor="dnf">dnf</Label>
                </div>
                <div className="flex items-center space-x-2">
                    <Checkbox id="pacman" />
                    <Label htmlFor="pacman">pacman</Label>
                </div>
                 <Button>Search</Button>
            </div>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Application</TableHead>
              <TableHead>Version</TableHead>
              <TableHead className="text-right w-[180px]">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {MOCK_SEARCHABLE_APPS.map((app) => (
              <TableRow key={app.id}>
                <TableCell className="font-medium">{app.name}</TableCell>
                <TableCell>{app.version}</TableCell>
                <TableCell className="text-right">
                  <Button variant="outline" size="sm" onClick={() => handleExport(app.name)}>
                    <Upload className="mr-2 h-4 w-4" />
                    Export to Host
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
