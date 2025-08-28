"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
} from "lucide-react";
import type { Container } from "@/lib/types";
import { MOCK_CONTAINERS } from "@/lib/mock-data";
import { CreateContainerDialog } from "@/components/create-container-dialog";
import { useToast } from "@/hooks/use-toast";
import { listContainers } from "@/lib/distrobox";

export default function Home() {
  const [containers, setContainers] = useState<Container[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setCreateDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    async function fetchContainers() {
      try {
        const fetchedContainers = await listContainers();
        setContainers(fetchedContainers);
      } catch (error) {
        console.error("Failed to list containers:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Could not fetch Distrobox containers. Is Distrobox installed?",
        });
      } finally {
        setLoading(false);
      }
    }
    fetchContainers();
  }, []);

  const toggleContainerStatus = (id: string) => {
    let newStatus: "running" | "stopped" = "stopped";
    setContainers((prev) =>
      prev.map((c) => {
        if (c.id === id) {
          newStatus = c.status === "running" ? "stopped" : "running";
          return {
            ...c,
            status: newStatus,
          };
        }
        return c;
      })
    );
    toast({
      title: "Container status changed",
      description: `Container is now ${newStatus}.`,
    });
  };
  
  const deleteContainer = (id: string) => {
    setContainers(prev => prev.filter(c => c.id !== id));
     toast({
      variant: "destructive",
      title: "Container deleted",
      description: "The container has been permanently removed.",
    });
  }

  const handleCreateContainer = (newContainerData: Omit<Container, "id" | "size" | "status">) => {
    const newContainer: Container = {
      ...newContainerData,
      id: `distrobox-${Math.random().toString(36).substring(7)}`,
      size: `${(Math.random() * 5 + 1).toFixed(1)} GB`,
      status: "stopped",
    };
    setContainers((prev) => [...prev, newContainer]);
    toast({
      title: "Container created",
      description: `New container "${newContainer.name}" has been created successfully.`,
    });
  };

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
          <Button onClick={() => setCreateDialogOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Create Container
          </Button>
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
                {containers.map((container) => (
                  <TableRow key={container.id}>
                    <TableCell>
                      <Badge
                        variant={
                          container.status === "running" ? "default" : "secondary"
                        }
                        className="capitalize"
                      >
                        {container.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">{container.name}</TableCell>
                    <TableCell>{container.image}</TableCell>
                    <TableCell className="font-mono text-xs">{container.id}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => toggleContainerStatus(container.id)}
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
                            onClick={() => deleteContainer(container.id)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            <span>Delete</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
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
    </div>
  );
}
