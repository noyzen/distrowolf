
"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Upload, Loader, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Container, SearchableApp } from "@/lib/types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { exportApp, searchContainerApps } from "@/lib/distrobox";

interface FindAppsPanelProps {
    container: Container;
}

const packageManagers = [
    { value: 'dpkg', label: 'dpkg (Debian/Ubuntu)' },
    { value: 'rpm', label: 'rpm (Fedora/RHEL)' },
    { value: 'pacman', label: 'pacman (Arch)' },
    { value: 'apk', label: 'apk (Alpine)' },
    { value: 'flatpak', label: 'Flatpak' },
    { value: 'snap', label: 'Snap' },
];

export function FindAppsPanel({ container }: FindAppsPanelProps) {
  const { toast } = useToast();
  const [packageManager, setPackageManager] = useState("dpkg");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchableApp[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isExporting, setIsExporting] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!searchQuery) return;
    setIsSearching(true);
    setSearchResults([]);
    try {
        const results = await searchContainerApps({
            containerName: container.name,
            packageManager,
            query: searchQuery,
        });
        setSearchResults(results);
        if (results.length === 0) {
            toast({
                title: "No Results",
                description: `No packages found matching "${searchQuery}" using ${packageManager}. Try another package manager.`,
            });
        }
    } catch(error: any) {
        toast({
            variant: "destructive",
            title: "Search Failed",
            description: error.message,
        });
    } finally {
        setIsSearching(false);
    }
  }

  const handleExport = async (appName: string) => {
    setIsExporting(appName);
    try {
        await exportApp({containerName: container.name, appName});
        toast({
            title: "Exporting Application",
            description: `"${appName}" from ${container.name} is being exported to the host.`,
        });
    } catch (error: any) {
        toast({
            variant: "destructive",
            title: "Export Failed",
            description: error.message,
        });
    } finally {
        setIsExporting(null);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">Find Applications in {container.name}</CardTitle>
        <CardDescription>
          Search for installed packages and export them to your host system.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
            <Input 
                placeholder="Search for applications..." 
                className="flex-grow"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
            <div className="flex items-center space-x-2">
               <Select value={packageManager} onValueChange={setPackageManager}>
                    <SelectTrigger className="w-full sm:w-[220px]">
                        <SelectValue placeholder="Select a package manager" />
                    </SelectTrigger>
                    <SelectContent>
                        {packageManagers.map(pm => (
                            <SelectItem key={pm.value} value={pm.value}>{pm.label}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                 <Button onClick={handleSearch} disabled={isSearching || !searchQuery}>
                    {isSearching ? <Loader className="mr-2 h-4 w-4 animate-spin"/> : <Search className="mr-2 h-4 w-4"/>}
                    Search
                 </Button>
            </div>
        </div>
        <div className="h-[300px] overflow-y-auto">
            <Table>
            <TableHeader className="sticky top-0 bg-card">
                <TableRow>
                <TableHead>Application</TableHead>
                <TableHead>Version</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right w-[180px]">Action</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {isSearching ? (
                    <TableRow>
                        <TableCell colSpan={4} className="h-24 text-center">
                            <div className="flex items-center justify-center gap-2 text-muted-foreground">
                                <Loader className="h-6 w-6 animate-spin" />
                                <span>Searching for packages...</span>
                            </div>
                        </TableCell>
                    </TableRow>
                ) : searchResults.length > 0 ? (
                searchResults.map((app) => (
                <TableRow key={app.id}>
                    <TableCell className="font-medium truncate max-w-xs">{app.name}</TableCell>
                    <TableCell className="truncate">{app.version}</TableCell>
                    <TableCell className="text-muted-foreground truncate max-w-sm">{app.description}</TableCell>
                    <TableCell className="text-right">
                    <Button variant="outline" size="sm" onClick={() => handleExport(app.name)} disabled={!!isExporting}>
                        {isExporting === app.name ? <Loader className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                        Export to Host
                    </Button>
                    </TableCell>
                </TableRow>
                ))
                ) : (
                    <TableRow>
                        <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                            Search for an application to see results.
                        </TableCell>
                    </TableRow>
                )}
            </TableBody>
            </Table>
        </div>
      </CardContent>
    </Card>
  );
}
