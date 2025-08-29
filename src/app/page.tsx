
"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
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
  PlusCircle,
  Home,
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
  toggleAutostart as apiToggleAutostart,
  copyToClipboard,
  listSharedApps,
} from "@/lib/distrobox";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { cn, getDistroIcon } from "@/lib/utils";
import { FindAppsPanel } from "@/components/find-apps-panel";
import { SharedAppsPanel } from "@/components/shared-apps-panel";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { useSearch } from "@/hooks/use-search";
import { ContainerInfoPanel } from "@/components/container-info-panel";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

type PanelMode = "apps" | "info";

const FlagBadge = React.memo(({ icon, text, enabled }: { icon: React.ElementType, text: string, enabled: boolean }) => {
  if (!enabled) return null;
  return (
      <TooltipProvider>
          <Tooltip>
              <TooltipTrigger asChild>
                  <Badge variant="secondary" className="gap-1.5 font-normal">
                      {React.createElement(icon, { className: "h-3 w-3" })}
                      <span className="hidden xl:inline">{text}</span>
                  </Badge>
              </TooltipTrigger>
              <TooltipContent>
                  <p>{text}</p>
              </TooltipContent>
          </Tooltip>
      </TooltipProvider>
  );
});
FlagBadge.displayName = 'FlagBadge';

const ContainerRow = React.memo(({ container, onSelect, isSelected, actioningContainerId, handlers }: { container: Container, onSelect: (c: Container) => void, isSelected: boolean, actioningContainerId: string | null, handlers: any }) => {
  const { handleToggleContainerStatus, handleEnterContainer, handleInfoContainer, handleSaveImage, handleToggleAutostart, handleDeleteConfirm } = handlers;
  
  return (
      <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          layout
          onClick={() => onSelect(container)}
          className={cn(
              "relative flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border rounded-lg transition-all duration-200 cursor-pointer hover:bg-muted/50",
              isSelected && "ring-2 ring-primary ring-inset bg-primary/10"
          )}
      >
          <div className="flex items-center gap-4 flex-1 min-w-0 w-full">
               <TooltipProvider>
                  <Tooltip>
                      <TooltipTrigger asChild>
                           <div className="flex items-center justify-center">
                              <span className={cn("h-3 w-3 rounded-full flex-shrink-0", container.status === 'running' ? 'bg-green-400 animate-pulse' : 'bg-red-400')}></span>
                          </div>
                      </TooltipTrigger>
                      <TooltipContent>
                         <p className="capitalize">{container.status}</p>
                      </TooltipContent>
                  </Tooltip>
              </TooltipProvider>

              <div className="flex flex-col min-w-0">
                  <span className="font-semibold truncate">{container.name}</span>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                     <i className={cn(getDistroIcon(container.image), "text-lg")}></i>
                     <span className="truncate">{container.image}</span>
                  </div>
              </div>
          </div>
          <div className="flex items-center gap-2 ml-0 sm:ml-4 mt-3 sm:mt-0 self-end sm:self-center">
               <div className="flex items-center gap-2">
                  <FlagBadge icon={Home} text="Isolated Home" enabled={container.home.type === 'Isolated'} />
                  <FlagBadge icon={Power} text="Autostart" enabled={container.autostart} />
               </div>
               <TooltipProvider>
                  <Tooltip>
                      <TooltipTrigger asChild>
                          <Button
                              variant={container.status === 'running' ? "destructive" : "default"}
                              size="sm"
                              className="w-24 flex-shrink-0"
                              onClick={(e) => { e.stopPropagation(); handleToggleContainerStatus(container); }}
                              disabled={!!actioningContainerId}
                          >
                              {actioningContainerId === container.id ? <Loader className="animate-spin" /> : (
                                  <>
                                      {container.status === 'running' ? <StopCircle /> : <Play />}
                                      <span className="ml-2">{container.status === 'running' ? 'Stop' : 'Start'}</span>
                                  </>
                              )}
                          </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                          <p>{container.status === 'running' ? `Stop ${container.name}` : `Start ${container.name}`}</p>
                      </TooltipContent>
                  </Tooltip>
               </TooltipProvider>
               <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-8 w-8 p-0 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                      <span className="sr-only">Open menu</span>
                      <MoreHorizontal className="h-4 w-4" />
                  </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
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
                      {container.autostart ? <PowerOff className="mr-2 h-4 w-4" /> : <Power className="mr-2 h-4 w-4" />}
                      <span>{container.autostart ? "Disable Autostart" : "Enable Autostart"}</span>
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
          </div>
      </motion.div>
  );
});
ContainerRow.displayName = 'ContainerRow';

export default function HomePage() {
  const [containers, setContainers] = useState<Container[]>([]);
  const [loading, setLoading] = useState(true);
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

  const fetchContainers = useCallback(async () => {
    setLoading(true);
    setActioningContainerId(null);
    try {
      const fetchedContainers = await listContainers();
      setContainers(fetchedContainers);
      
      if (selectedContainer) {
        const updatedSelected = fetchedContainers.find(c => c.id === selectedContainer.id);
        if (updatedSelected) {
          setSelectedContainer(prev => prev ? {...prev, ...updatedSelected} : null);
        } else {
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
    fetchContainers();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  useEffect(() => {
    if (selectedContainer) {
      fetchSharedApps();
    } else {
      setSharedApps([]); 
    }
  }, [selectedContainer, fetchSharedApps]);


  const handleToggleContainerStatus = useCallback(async (container: Container) => {
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
        await fetchContainers(); 
        setActioningContainerId(null);
    }
  }, [fetchContainers, toast]);

  const handleDeleteConfirm = useCallback((container: Container) => {
    setContainerToDelete(container);
  }, []);
  
  const handleDeleteContainer = useCallback(async () => {
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
        await fetchContainers();
        setActioningContainerId(null);
    }
  }, [containerToDelete, fetchContainers, selectedContainer?.id, toast]);

  const handleEnterContainer = useCallback(async (containerName: string) => {
    try {
      const result = await enterContainer(containerName);
      if (result.launched) {
        toast({
          title: 'Terminal Launched',
          description: `Opening ${containerName} in a new terminal window.`
        });
      } else {
        setDialogContent({
          title: `Enter Container: ${containerName}`,
          message: result.message!
        });
        setEnterDialogOpen(true);
      }
    } catch(error: any) {
      toast({
        variant: "destructive",
        title: "Failed to enter container",
        description: error.message,
      });
    }
  }, [toast]);
  
  const handleInfoContainer = useCallback(async (container: Container) => {
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
  }, [selectedContainer?.id, selectedContainerInfo, toast]);

  const handleSaveImage = useCallback(async (container: Container) => {
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
  }, [toast]);

  const handleToggleAutostart = useCallback(async (container: Container) => {
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
        await fetchContainers(); 
    } catch(error: any) {
        toast({
            variant: "destructive",
            title: "Failed to Toggle Autostart",
            description: error.message,
        });
    }
  }, [fetchContainers, toast]);
  
  const handleRowClick = useCallback((container: Container) => {
    if (selectedContainer?.id === container.id) {
      setSelectedContainer(null);
      setSelectedContainerInfo(null);
    } else {
      setSelectedContainer(container);
      setActivePanel("apps"); 
      setSelectedContainerInfo(null);
    }
  }, [selectedContainer?.id]);

  const rowHandlers = useMemo(() => ({
    handleToggleContainerStatus,
    handleEnterContainer,
    handleInfoContainer,
    handleSaveImage,
    handleToggleAutostart,
    handleDeleteConfirm,
  }), [handleToggleContainerStatus, handleEnterContainer, handleInfoContainer, handleSaveImage, handleToggleAutostart, handleDeleteConfirm]);


  if (loading) {
    return (
        <div className="flex flex-col items-center justify-center h-full min-h-[400px]">
            <Loader className="h-12 w-12 animate-spin text-primary" />
            <p className="mt-4 text-lg text-muted-foreground">Loading containers...</p>
        </div>
    )
  }

  const renderActivePanel = () => {
    if (!selectedContainer) return null;

    switch (activePanel) {
      case "info":
        return <ContainerInfoPanel info={selectedContainerInfo} container={selectedContainer} onBack={() => setActivePanel("apps")} />;
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
            <FindAppsPanel container={selectedContainer} onAppShared={fetchSharedApps} />
            <SharedAppsPanel container={selectedContainer} sharedApps={sharedApps} onAppUnshared={fetchSharedApps} />
          </motion.div>
        );
    }
  };
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-4">
          <div className="flex-grow">
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
          <ScrollArea className="h-auto max-h-[calc(100vh-480px)] pr-2">
            <div className="space-y-2 p-1">
              {filteredContainers.length === 0 && !loading ? (
                  <div className="flex flex-col items-center justify-center h-48 gap-4 text-center">
                      <Box className="h-12 w-12 text-muted-foreground" />
                      <div>
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
              ) : (
                <AnimatePresence>
                  {filteredContainers.map((container) => (
                      <ContainerRow 
                          key={container.id} 
                          container={container}
                          onSelect={handleRowClick}
                          isSelected={selectedContainer?.id === container.id}
                          actioningContainerId={actioningContainerId}
                          handlers={rowHandlers}
                      />
                  ))}
                </AnimatePresence>
              )}
            </div>
          </ScrollArea>
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
      
      <AlertDialog open={!!containerToDelete} onOpenChange={(open) => !open && setContainerToDelete(null)}>
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

    