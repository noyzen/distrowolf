
"use client";

import { useState, useEffect } from "react";
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
  PlusCircle,
  Play,
  StopCircle,
  Terminal,
  Info,
  Trash2,
  Save,
  Power,
  PowerOff,
  Wrench,
  ShieldCheck,
  Loader,
  RefreshCw,
} from "lucide-react";
import type { Container } from "@/lib/types";
import { CreateContainerDialog } from "@/components/create-container-dialog";
import { useToast } from "@/hooks/use-toast";
import { listContainers, startContainer, stopContainer, deleteContainer as removeContainer } from "@/lib/distrobox";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

export default function Home() {
  const [containers, setContainers] = useState<Container[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setCreateDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedContainer, setSelectedContainer] = useState<Container | null>(null);
  const [actioningContainerId, setActioningContainerId] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchContainers = async () => {
    setLoading(true);
    try {
      const fetchedContainers = await listContainers();
      setContainers(fetchedContainers);
    } catch (error: any) {
      console.error("Failed to list containers:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: `Could not fetch Distrobox containers. Is Distrobox installed? (${error.message})`,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContainers();
  }, []);

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
      await fetchContainers();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: `Failed to ${actionName.toLowerCase()} container`,
        description: error.message,
      });
    } finally {
        setActioningContainerId(null);
    }
  };

  const handleDeleteConfirm = (container: Container) => {
    setSelectedContainer(container);
    setDeleteDialogOpen(true);
  };
  
  const handleDeleteContainer = async () => {
    if (!selectedContainer) return;
    
    toast({
      title: "Deleting container...",
      description: `Request sent to delete "${selectedContainer.name}".`,
    });

    setActioningContainerId(selectedContainer.id);
    try {
      await removeContainer(selectedContainer.name);
      toast({
        variant: "destructive",
        title: "Container deleted",
        description: `Container "${selectedContainer.name}" has been removed.`,
      });
      await fetchContainers();
    } catch (error: any) {
       toast({
        variant: "destructive",
        title: "Failed to delete container",
        description: error.message,
      });
    } finally {
        setDeleteDialogOpen(false);
        setSelectedContainer(null);
        setActioningContainerId(null);
    }
  };

  const handleCreateContainer = (newContainerData: Omit<Container, "id" | "size" | "status">) => {
    const newContainer: Container = {
      ...newContainerData,
      id: `distrobox-${Math.random().toString(36).substring(7)}`,
      size: `N/A`,
      status: "stopped",
    };
    setContainers((prev) => [...prev, newContainer]);
    toast({
      title: "Container created",
      description: `New container "${newContainer.name}" has been created successfully.`,
    });
  };
  
  const handleRowClick = (container: Container) => {
    if (selectedContainer?.id === container.id) {
        setSelectedContainer(null); // Unselect if clicked again
    } else {
        setSelectedContainer(container);
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <ShieldCheck className="h-6 w-6 text-primary" />
            <CardTitle className="font-headline">System Information</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 bg-secondary/30 rounded-lg">
            <div>
              <p className="font-semibold">Distrobox Status</p>
              <p className="text-sm text-muted-foreground">
                Distrobox and dependencies are installed and running correctly.
              </p>
            </div>
            <Button variant="outline">
              <Wrench className="mr-2 h-4 w-4" />
              Run Diagnostics
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="font-headline">Containers</CardTitle>
            <CardDescription>
              Manage your Distrobox containers.
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={fetchContainers}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
            <Button onClick={() => setCreateDialogOpen(true)}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Create Container
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <Loader className="h-8 w-8 animate-spin text-primary" />
              <p className="ml-4 text-muted-foreground">Loading containers...</p>
            </div>
          ) : (
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
                {containers.length === 0 && !loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                      No containers found. Create one to get started!
                    </TableCell>
                  </TableRow>
                ) : (
                  containers.map((container) => (
                    <TableRow 
                        key={container.id} 
                        onClick={() => handleRowClick(container)}
                        className={cn("cursor-pointer transition-colors duration-300", 
                            selectedContainer?.id === container.id && "bg-primary/10 ring-2 ring-primary ring-inset shadow-lg"
                        )}
                    >
                      <TableCell>
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
                      <TableCell>{container.image}</TableCell>
                      <TableCell className="font-mono text-xs">{container.id}</TableCell>
                      <TableCell className="text-right">
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
                            <DropdownMenuItem>
                              <Terminal className="mr-2 h-4 w-4" />
                              <span>Enter</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Info className="mr-2 h-4 w-4" />
                              <span>Info</span>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>
                              <Save className="mr-2 h-4 w-4" />
                              <span>Save as Image</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem>
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
          )}
        </CardContent>
      </Card>
      <CreateContainerDialog
        open={isCreateDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onCreate={handleCreateContainer}
      />
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              <span className="font-bold"> {selectedContainer?.name} </span>
              container and all of its data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedContainer(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteContainer} className={buttonVariants({ variant: "destructive" })}>
               {actioningContainerId === selectedContainer?.id ? <Loader className="mr-2 h-4 w-4 animate-spin" /> : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
