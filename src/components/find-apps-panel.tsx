
"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Upload, Loader, Search, Settings, Info } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Container, SearchableApp } from "@/lib/types";
import { exportApp, searchContainerApps } from "@/lib/distrobox";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface FindAppsPanelProps {
    container: Container;
}

const allPackageManagers = [
    { value: 'dpkg', label: 'dpkg (Debian/Ubuntu)' },
    { value: 'rpm', label: 'rpm (Fedora/RHEL)' },
    { value: 'dnf', label: 'dnf (Fedora)' },
    { value: 'yum', label: 'yum (RHEL)' },
    { value: 'pacman', label: 'pacman (Arch)' },
    { value: 'zypper', label: 'zypper (openSUSE)' },
    { value: 'apk', label: 'apk (Alpine)' },
    { value: 'equery', label: 'equery (Gentoo)' },
    { value: 'xbps-query', label: 'xbps (Void)' },
    { value: 'nix-env', label: 'nix-env (NixOS)' },
    { value: 'guix', label: 'guix (Guix)' },
    { value: 'slack', label: 'slack (Slackware)' },
    { value: 'eopkg', label: 'eopkg (Solus)' },
    { value: 'snap', label: 'snap' },
    { value: 'flatpak', label: 'flatpak' },
];

export function FindAppsPanel({ container }: FindAppsPanelProps) {
  const { toast } = useToast();
  const [selectedPMs, setSelectedPMs] = useState<string[]>(["dpkg"]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchableApp[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isExporting, setIsExporting] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!searchQuery || selectedPMs.length === 0) return;
    setIsSearching(true);
    setSearchResults([]);
    toast({
      title: "Searching for applications...",
      description: `Using ${selectedPMs.join(', ')} to find "${searchQuery}".`,
    });

    try {
        // Note: Currently, the backend only supports searching with one PM at a time.
        // This sends a request for the first selected PM.
        const results = await searchContainerApps({
            containerName: container.name,
            packageManager: selectedPMs[0], 
            query: searchQuery,
        });
        setSearchResults(results);
        if (results.length === 0) {
            toast({
                title: "No Results",
                description: `No packages found matching "${searchQuery}" using ${selectedPMs[0]}. Try another package manager.`,
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

  const handlePMSelection = (pm: string) => {
      setSelectedPMs(prev => 
          prev.includes(pm) ? prev.filter(p => p !== pm) : [...prev, pm]
      );
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
                placeholder="Search for an application..." 
                className="flex-grow"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
            <div className="flex items-center space-x-2">
                <Dialog>
                    <DialogTrigger asChild>
                       <Button variant="outline" size="icon"><Settings /></Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Select Package Managers</DialogTitle>
                            <DialogDescription>
                                Choose one or more package managers to search with. The search will use the first selected manager.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid grid-cols-2 gap-4 py-4 max-h-96 overflow-y-auto">
                            {allPackageManagers.map(pm => (
                                <div key={pm.value} className="flex items-center space-x-2">
                                    <Checkbox 
                                        id={pm.value} 
                                        checked={selectedPMs.includes(pm.value)}
                                        onCheckedChange={() => handlePMSelection(pm.value)}
                                    />
                                    <Label htmlFor={pm.value} className="cursor-pointer">{pm.label}</Label>
                                </div>
                            ))}
                        </div>
                    </DialogContent>
                </Dialog>
                 <Button onClick={handleSearch} disabled={isSearching || !searchQuery || selectedPMs.length === 0} className="flex-grow sm:flex-grow-0">
                    {isSearching ? <Loader className="mr-2 h-4 w-4 animate-spin"/> : <Search className="mr-2 h-4 w-4"/>}
                    Search
                 </Button>
            </div>
        </div>
        <div className="text-xs text-muted-foreground flex items-center gap-2">
            <Info className="h-4 w-4"/>
            <span>Searching with: {selectedPMs.length > 0 ? selectedPMs.join(', ') : 'None selected'}</span>
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

    