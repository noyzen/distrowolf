
"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Upload, Loader, Search, Settings, Info, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Container, SearchableApp, SharedApp } from "@/lib/types";
import { exportApp, searchContainerApps } from "@/lib/distrobox";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "./ui/badge";

interface FindAppsPanelProps {
    container: Container;
    sharedApps: SharedApp[];
    onAppShared: () => void;
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
    { value: 'flatpak', label: 'flatpak' },
    { value: 'snap', label: 'snap' },
];

export function FindAppsPanel({ container, sharedApps, onAppShared }: FindAppsPanelProps) {
  const { toast } = useToast();
  const [selectedPM, setSelectedPM] = useState<string>("dpkg");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchableApp[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isExporting, setIsExporting] = useState<string | null>(null);

  const sharedAppNames = sharedApps.map(app => app.name);

  const handleSearch = async () => {
    if (!searchQuery || !selectedPM) return;
    setIsSearching(true);
    setSearchResults([]);
    toast({
      title: "Searching for applications...",
      description: `Using ${selectedPM} to find "${searchQuery}".`,
    });

    try {
        const results = await searchContainerApps({
            containerName: container.name,
            packageManager: selectedPM, 
            query: searchQuery,
        });
        setSearchResults(results);
        if (results.length === 0) {
            toast({
                title: "No Results",
                description: `No packages found matching "${searchQuery}" using ${selectedPM}.`,
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
    toast({
        title: "Sharing Application",
        description: `"${appName}" from ${container.name} is being shared. It will appear in 'Shared Apps' shortly.`,
    });
    try {
        await exportApp({containerName: container.name, appName});
        toast({
            title: "Share Successful",
            description: `"${appName}" has been shared with the host.`,
        });
        onAppShared(); // Notify parent to refresh shared apps
    } catch (error: any) {
        toast({
            variant: "destructive",
            title: "Share Failed",
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
          Search for installed packages and share them with your host system.
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
                            <DialogTitle>Select Package Manager</DialogTitle>
                            <DialogDescription>
                                Choose the package manager to search with.
                            </DialogDescription>
                        </DialogHeader>
                        <ScrollArea className="max-h-96">
                            <RadioGroup value={selectedPM} onValueChange={setSelectedPM} className="grid grid-cols-2 gap-4 py-4 pr-4">
                                {allPackageManagers.map(pm => (
                                    <div key={pm.value} className="flex items-center space-x-2">
                                        <RadioGroupItem value={pm.value} id={pm.value} />
                                        <Label htmlFor={pm.value} className="cursor-pointer">{pm.label}</Label>
                                    </div>
                                ))}
                            </RadioGroup>
                        </ScrollArea>
                    </DialogContent>
                </Dialog>
                 <Button onClick={handleSearch} disabled={isSearching || !searchQuery || !selectedPM} className="flex-grow sm:flex-grow-0">
                    {isSearching ? <Loader className="mr-2 h-4 w-4 animate-spin"/> : <Search className="mr-2 h-4 w-4"/>}
                    Search
                 </Button>
            </div>
        </div>
        <div className="text-xs text-muted-foreground flex items-center gap-2">
            <Info className="h-4 w-4"/>
            <span>Searching with: {selectedPM || 'None selected'}</span>
        </div>
        <ScrollArea className="h-[300px] border rounded-lg">
            <Table>
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
                    <React.Fragment key={app.id}>
                        <TableRow>
                            <TableCell className="font-medium">
                                {app.name}
                                <span className="font-normal text-muted-foreground ml-2">{app.version}</span>
                            </TableCell>
                            <TableCell className="text-right">
                            { sharedAppNames.includes(app.name) ? (
                                <Badge variant="secondary" className="gap-1.5">
                                    <CheckCircle className="h-4 w-4"/>
                                    Shared
                                </Badge>
                            ) : (
                                <Button variant="outline" size="sm" onClick={() => handleExport(app.name)} disabled={!!isExporting}>
                                    {isExporting === app.name ? <Loader className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                                    Share
                                </Button>
                            )}
                            </TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell colSpan={2} className="pt-0 pb-2 text-sm text-muted-foreground">
                                {app.description}
                            </TableCell>
                        </TableRow>
                    </React.Fragment>
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
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

    