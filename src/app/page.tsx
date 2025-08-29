
"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import {
  MoreHorizontal,
  Play,
  StopCircle,
  Terminal,
  Info,
  Trash2,
  Save,
  Power,
  PowerOff,
  Loader,
  RefreshCw,
  Box,
  Copy,
} from "lucide-react";
import type { Container, SharedApp } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { 
  listContainers, 
  startContainer, 
  stopContainer, 
  deleteContainer as removeContainer,
  enterContainer,
  infoContainer,
  saveContainerAsImage,
  checkDependencies,
  toggleAutostart as apiToggleAutostart,
  copyToClipboard,
  listSharedApps,
} from "@/lib/distrobox";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { cn, getDistroIcon } from "@/lib/utils";
import { FindAppsPanel } from "@/components/find-apps-panel";
import { SharedAppsPanel } from "@/components/shared-apps-panel";
import { AnimatePresence, motion } from "framer-motion";
import { SetupWizard } from "@/components/setup-wizard";
import Link from "next/link";
import { PlusCircle } from "lucide-react";
import { useSearch } from "@/hooks/use-search";
import { ContainerInfoPanel } from "@/components/container-info-panel";

type PanelMode = "apps" | "info";

export default function Home() {
  const [containers, setContainers] = useState<Container[]>([]);
  const [dependencies, setDependencies] = useState<{ distroboxInstalled: boolean, podmanInstalled: boolean } | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDeleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isEnterDialogOpen, setEnterDialogOpen] = useState(false);
  const [dialogContent, setDialogContent] = useState({ title: "", message: "" });
  const [selectedContainer, setSelectedContainer] = useState<Container | null>(null);
  const [selectedContainerInfo, setSelectedContainerInfo] = useState<any | null>(null);
  const [sharedApps, setSharedApps] = useState<SharedApp[]>([]);
  const [containerToDelete, setContainerToDelete] = useState<Container | null>(null);
  const [actioningContainerId, setActioningContainerId] = useState<string | null>(null);
  const [activePanel, setActivePanel] = useState<PanelMode>("apps");
  const { toast } = useToast();
  const { searchTerm } = useSearch();

  const filteredContainers = useMemo(() => {
    if (!searchTerm) return containers;
    return containers.filter(container =>
      container.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      container.image.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, containers]);

  const checkSystemDependencies = async () => {
    const deps = await checkDependencies();
    setDependencies(deps);
    return deps;
  }

  const fetchContainers = useCallback(async () => {
    setLoading(true);
    setActioningContainerId(null);
    try {
      const fetchedContainers = await listContainers();
      setContainers(fetchedContainers);
      
      if (selectedContainer) {
        const updatedSelected = fetchedContainers.find(c => c.id === selectedContainer.id);
        if (updatedSelected) {
          setSelectedContainer(updatedSelected);
        } else {
          // The selected container was deleted, so clear the selection
          setSelectedContainer(null);
        }
      }

    } catch (error: any) {
      console.error("Failed to list containers:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: `Could not fetch Distrobox data. Is Distrobox installed? (${error.message})`,
      });
    } finally {
      setLoading(false);
    }
  }, [toast, selectedContainer?.id]);

  const fetchSharedApps = useCallback(async () => {
    if (!selectedContainer) {
        setSharedApps([]);
        return;
    }
    try {
        const apps = await listSharedApps(selectedContainer.name);
        setSharedApps(apps);
    } catch (error: any) {
        setSharedApps([]);
    }
  }, [selectedContainer]);


  useEffect(() => {
    checkSystemDependencies().then(deps => {
        if (deps.distroboxInstalled && deps.podmanInstalled) {
            fetchContainers();
        } else {
            setLoading(false);
        }
    });
  }, []); // Run only once on mount
  
  useEffect(() => {
    if (selectedContainer) {
      fetchSharedApps();
    } else {
      setSharedApps([]); // Clear shared apps when no container is selected
    }
  }, [selectedContainer, fetchSharedApps]);


  const handleToggleContainerStatus = async (container: Container) => {
    const isRunning = container.status === "running";
    const action = isRunning ? stopContainer : startContainer;
    const actionName = isRunning ? "Stopping" : "Starting";
    const newStatus = isRunning ? "stopped" : "running";

    toast({
      title: `${actionName} container...`,
      description: `Request sent to ${actionName.toLowerCase()} "${container.name}".`,
    });
    
    setActioningContainerId(container.id);

    try {
      await action(container.name);
      toast({
        title: "Success",
        description: `Container "${container.name}" is now ${newStatus}.`,
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: `Failed to ${actionName.toLowerCase()} container`,
        description: error.message,
      });
    } finally {
        await fetchContainers(); // Refreshes the state regardless of outcome
        setActioningContainerId(null);
    }
  };

  const handleDeleteConfirm = (container: Container) => {
    setContainerToDelete(container);
    setDeleteDialogOpen(true);
  };
  
  const handleDeleteContainer = async () => {
    if (!containerToDelete) return;
    
    toast({
      title: "Deleting container...",
      description: `Request sent to delete "${containerToDelete.name}".`,
    });

    setActioningContainerId(containerToDelete.id);
    try {
      await removeContainer(containerToDelete.name);
      toast({
        title: "Container deleted",
        description: `Container "${containerToDelete.name}" has been removed.`,
      });
      if (selectedContainer?.id === containerToDelete.id) {
         setSelectedContainer(null); 
         setSelectedContainerInfo(null);
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Failed to delete container",
        description: error.message,
      });
    } finally {
        setContainerToDelete(null);
        setDeleteDialogOpen(false);
        await fetchContainers();
        setActioningContainerId(null);
    }
  };

  const handleEnterContainer = async (containerName: string) => {
    try {
      const result = await enterContainer(containerName);
      setDialogContent({
        title: `Enter Container: ${containerName}`,
        message: result.message!
      });
      setEnterDialogOpen(true);
    } catch(error: any) {
      toast({
        variant: "destructive",
        title: "Failed to get enter command",
        description: error.message,
      });
    }
  }
  
  const handleInfoContainer = async (container: Container) => {
    if (selectedContainer?.id !== container.id || !selectedContainerInfo) {
      try {
          const res = await infoContainer(container.name);
          setSelectedContainerInfo(JSON.parse(res.message || '{}'));
      } catch(error: any) {
          toast({
              variant: "destructive",
              title: "Failed to get container info",
              description: error.message,
          });
          setSelectedContainerInfo(null);
      }
    }
    setActivePanel("info");
    setSelectedContainer(container);
  }

  const handleSaveImage = async (container: Container) => {
    toast({
        title: "Saving Image...",
        description: `Creating an image from container "${container.name}". This may take a moment.`,
    });
    try {
        const result = await saveContainerAsImage(container.name);
        if(result.success) {
            toast({
                title: "Image Saved",
                description: `Successfully created image: ${result.imageName}`,
            });
        } else {
             throw new Error(result.error || "Unknown error occurred.");
        }
    } catch(error: any) {
        toast({
            variant: "destructive",
            title: "Failed to Save Image",
            description: error.message,
        });
    }
  }

  const handleToggleAutostart = async (container: Container) => {
    const newAutostartState = !container.autostart;
    toast({
        title: newAutostartState ? "Enabling Autostart..." : "Disabling Autostart...",
        description: `Setting autostart for "${container.name}" to ${newAutostartState}.`,
    });
    try {
        await apiToggleAutostart(container.name, newAutostartState);
        toast({
            title: "Success!",
            description: `Autostart for "${container.name}" has been ${newAutostartState ? 'enabled' : 'disabled'}.`,
        });
        await fetchContainers(); // Refresh to show the new state
    } catch(error: any) {
        toast({
            variant: "destructive",
            title: "Failed to Toggle Autostart",
            description: error.message,
        });
    }
  }
  
  const handleRowClick = (container: Container) => {
    if (selectedContainer?.id === container.id) {
      setSelectedContainer(null);
      setSelectedContainerInfo(null);
    } else {
      setSelectedContainer(container);
      setActivePanel("apps"); // Default to apps view on new selection
      setSelectedContainerInfo(null); // Clear old info
    }
  }

  if (loading && containers.length === 0 && dependencies) {
    return (
        <div className="flex flex-col items-center justify-center h-full min-h-[400px]">
            <Loader className="h-12 w-12 animate-spin text-primary" />
            <p className="mt-4 text-lg text-muted-foreground">Loading containers...</p>
        </div>
    )
  }

  if (dependencies && (!dependencies.distroboxInstalled || !dependencies.podmanInstalled)) {
      return <SetupWizard dependencies={dependencies} />;
  }

  const renderActivePanel = () => {
    if (!selectedContainer) return null;

    switch (activePanel) {
      case "info":
        return <ContainerInfoPanel info={selectedContainerInfo} onBack={() => setActivePanel("apps")} />;
      case "apps":
      default:
        return (
          <motion.div
            key="apps-panels"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-6"
          >
            <FindAppsPanel container={selectedContainer} sharedApps={sharedApps} onAppShared={fetchSharedApps} />
            <SharedAppsPanel container={selectedContainer} sharedApps={sharedApps} onAppUnshared={fetchSharedApps} />
          </motion.div>
        );
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="font-headline">My Containers</CardTitle>
            <CardDescription>
              Select a container to manage its applications, or create a new one.
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={fetchContainers} disabled={loading}>
              {loading && !actioningContainerId ? <Loader className="mr-2 h-4 w-4 animate-spin"/> : <RefreshCw className="mr-2 h-4 w-4" />}
              Refresh
            </Button>
            <Button asChild>
                <Link href="/create">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Create Container
                </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">Status</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Image</TableHead>
                  <TableHead>ID</TableHead>
                  <TableHead className="text-right w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredContainers.length === 0 && !loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                       <div className="flex flex-col items-center gap-4">
                            <Box className="h-12 w-12 text-muted-foreground" />
                            <div className="text-center">
                                <h3 className="font-semibold">No containers found</h3>
                                <p className="text-muted-foreground">{searchTerm ? "No containers match your search." : "Create a container to get started!"}</p>
                            </div>
                           {!searchTerm && (
                                <Button asChild>
                                <Link href="/create">
                                    <PlusCircle className="mr-2 h-4 w-4" />
                                    Create Container
                                </Link>
                                </Button>
                           )}
                       </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredContainers.map((container) => (
                    <TableRow 
                        key={container.id} 
                        onClick={() => handleRowClick(container)}
                        className={cn(
                            "cursor-pointer", 
                            selectedContainer?.id === container.id && "bg-primary/10"
                        )}
                    >
                      <TableCell className={cn(selectedContainer?.id === container.id && "rounded-l-lg")}>
                        <Badge
                          variant={
                            container.status === "running" ? "default" : "secondary"
                          }
                          className="capitalize"
                        >
                           {actioningContainerId === container.id ? (
                                <Loader className="mr-2 h-3 w-3 animate-spin"/>
                            ) : (
                                <span className={cn("h-2 w-2 rounded-full mr-2", container.status === 'running' ? 'bg-green-400' : 'bg-red-400')}></span>
                            )}
                          {container.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">{container.name}</TableCell>
                      <TableCell className="flex items-center gap-2">
                        <i className={cn(getDistroIcon(container.image), "text-2xl")}></i>
                        <span>{container.image}</span>
                      </TableCell>
                      <TableCell className="font-mono text-xs">{container.id}</TableCell>
                      <TableCell className={cn("text-right", selectedContainer?.id === container.id && "rounded-r-lg")}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0" onClick={(e) => e.stopPropagation()}>
                              <span className="sr-only">Open menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                            <DropdownMenuItem
                              onClick={() => handleToggleContainerStatus(container)}
                              disabled={!!actioningContainerId}
                            >
                              {container.status === "running" ? (
                                <StopCircle className="mr-2 h-4 w-4" />
                              ) : (
                                <Play className="mr-2 h-4 w-4" />
                              )}
                              <span>
                                {container.status === "running" ? "Stop" : "Start"}
                              </span>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEnterContainer(container.name)}>
                              <Terminal className="mr-2 h-4 w-4" />
                              <span>Enter</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleInfoContainer(container)}>
                              <Info className="mr-2 h-4 w-4" />
                              <span>Info</span>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleSaveImage(container)}>
                              <Save className="mr-2 h-4 w-4" />
                              <span>Save as Image</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleToggleAutostart(container)}>
                              {container.autostart ? (
                                <PowerOff className="mr-2 h-4 w-4" />
                              ) : (
                                <Power className="mr-2 h-4 w-4" />
                              )}
                              <span>
                                {container.autostart
                                  ? "Disable Autostart"
                                  : "Enable Autostart"}
                              </span>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive-foreground focus:bg-destructive"
                              onClick={() => handleDeleteConfirm(container)}
                              disabled={!!actioningContainerId}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              <span>Delete</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
        </CardContent>
      </Card>

      <AnimatePresence mode="wait">
        <motion.div
          key={selectedContainer ? `${selectedContainer.id}-${activePanel}` : 'empty'}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {renderActivePanel()}
        </motion.div>
      </AnimatePresence>
      
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              <span className="font-bold"> {containerToDelete?.name} </span>
              container and all of its data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setContainerToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteContainer} className={buttonVariants({ variant: "destructive" })}>
               {actioningContainerId === containerToDelete?.id ? <Loader className="mr-2 h-4 w-4 animate-spin" /> : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={isEnterDialogOpen} onOpenChange={setEnterDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{dialogContent.title}</AlertDialogTitle>
            <AlertDialogDescription>
                Run the following command in your terminal:
                <div className="mt-4 bg-background/50 p-4 rounded-lg flex items-center justify-between">
                    <code className="font-mono text-foreground">{dialogContent.message}</code>
                    <Button variant="ghost" size="icon" onClick={() => {
                        copyToClipboard(dialogContent.message);
                        toast({ title: "Copied!", description: "Command copied to clipboard." });
                    }}>
                        <Copy className="h-4 w-4" />
                    </Button>
                </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setEnterDialogOpen(false)}>OK</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

    