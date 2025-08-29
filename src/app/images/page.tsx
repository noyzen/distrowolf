
"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Upload, Trash2, Download, RefreshCw, Loader, HardDrive } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { listLocalImages, deleteImage, exportImage, importImage } from "@/lib/distrobox";
import type { LocalImage } from "@/lib/types";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { buttonVariants } from "@/components/ui/button";
import { useSearch } from "@/hooks/use-search";
import { cn, getDistroIcon } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export default function ImagesPage() {
  const { toast } = useToast();
  const [localImages, setLocalImages] = useState<LocalImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [imageToDelete, setImageToDelete] = useState<LocalImage | null>(null);
  const { searchTerm } = useSearch();

  const filteredImages = useMemo(() => {
    if (!searchTerm) return localImages;
    return localImages.filter(image =>
      image.repository.toLowerCase().includes(searchTerm.toLowerCase()) ||
      image.tag.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, localImages]);

  const fetchImages = useCallback(async () => {
    setLoading(true);
    try {
      const images = await listLocalImages();
      setLocalImages(images);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Failed to fetch local images.",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchImages();
  }, [fetchImages]);

  const handleDeleteConfirm = (image: LocalImage) => {
    setImageToDelete(image);
  };

  const handleDeleteImage = async () => {
    if (!imageToDelete) return;
    setIsDeleting(imageToDelete.id);
    toast({
      title: "Deleting Image",
      description: `Request sent to delete image ${imageToDelete.imageID.substring(0, 12)}.`,
    });

    try {
      await deleteImage(imageToDelete.imageID);
      toast({
        title: "Image Deleted",
        description: `${imageToDelete.repository}:${imageToDelete.tag} has been deleted.`,
      });
      fetchImages(); // Refresh the list
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Failed to Delete Image",
        description: error.message,
      });
    } finally {
      setIsDeleting(null);
      setImageToDelete(null);
    }
  };

  const handleExport = async (image: LocalImage) => {
    toast({ title: "Preparing to export image...", description: `Image: ${image.repository}:${image.tag}`});
    try {
        const result = await exportImage(image);
        if(result.success) {
            toast({ title: "Export complete!", description: `Image saved to: ${result.path}`});
        } else if (result.cancelled) {
             toast({ variant: "default", title: "Export cancelled", description: "You cancelled the file save operation."});
        } else {
            throw new Error(result.error || "Export failed for an unknown reason.");
        }
    } catch (error: any) {
        toast({ variant: "destructive", title: "Export Failed", description: error.message });
    }
  }

  const handleImport = async () => {
    toast({ title: "Opening file dialog to import image..." });
     try {
        const result = await importImage();
        if(result.success) {
            toast({ title: "Import complete!", description: `Successfully loaded image from ${result.path}.`});
            fetchImages();
        } else if (result.cancelled) {
             toast({ variant: "default", title: "Import cancelled", description: "You cancelled the file open operation."});
        } else {
            throw new Error(result.error || "Import failed for an unknown reason.");
        }
    } catch (error: any) {
        toast({ variant: "destructive", title: "Import Failed", description: error.message });
    }
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-4">
          <div className="flex-grow">
            <CardTitle className="font-headline">Local Images</CardTitle>
            <CardDescription>
              Manage container images available on your local machine.
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={fetchImages} disabled={loading}>
              {loading ? <Loader className="mr-2 h-4 w-4 animate-spin"/> : <RefreshCw className="mr-2 h-4 w-4" />} Refresh
            </Button>
            <Button variant="outline" onClick={handleImport}>
              <Upload className="mr-2 h-4 w-4" /> Import Image
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[calc(100vh-250px)]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Repository</TableHead>
                  <TableHead className="hidden sm:table-cell">Tag</TableHead>
                  <TableHead className="hidden md:table-cell">Image ID</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead className="hidden lg:table-cell">Created</TableHead>
                  <TableHead className="text-right w-[120px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      <div className="flex items-center justify-center gap-2 text-muted-foreground">
                        <Loader className="h-6 w-6 animate-spin" />
                        <span>Loading local images...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredImages.length > 0 ? (
                  filteredImages.map((image) => (
                    <TableRow key={image.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                            <i className={cn(getDistroIcon(image.repository), "text-2xl")}></i>
                            <div className="flex flex-col">
                                <span>{image.repository}</span>
                                <span className="text-muted-foreground sm:hidden text-xs">{image.tag}</span>
                            </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">{image.tag}</TableCell>
                      <TableCell className="hidden md:table-cell font-mono text-xs">{image.imageID.substring(0, 12)}</TableCell>
                      <TableCell>{image.size}</TableCell>
                      <TableCell className="hidden lg:table-cell text-muted-foreground">{image.created}</TableCell>
                      <TableCell className="text-right">
                        <TooltipProvider>
                          <div className="flex justify-end gap-2">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" onClick={() => handleExport(image)}>
                                  <Download className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Export (.tar)</p>
                              </TooltipContent>
                            </Tooltip>
                            <Tooltip>
                               <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => handleDeleteConfirm(image)}>
                                    {isDeleting === image.id ? <Loader className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                                </Button>
                               </TooltipTrigger>
                               <TooltipContent>
                                <p>Delete Image</p>
                               </TooltipContent>
                            </Tooltip>
                          </div>
                        </TooltipProvider>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      <div className="flex flex-col items-center gap-4">
                        <HardDrive className="h-12 w-12 text-muted-foreground" />
                        <div className="text-center">
                          <h3 className="font-semibold">No local images found</h3>
                          <p className="text-muted-foreground">{searchTerm ? "No images match your search." : "Download an image or pull one using podman."}</p>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>
      
      <AlertDialog open={!!imageToDelete} onOpenChange={(open) => !open && setImageToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the image <span className="font-bold">{imageToDelete?.repository}:{imageToDelete?.tag}</span>. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setImageToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteImage} className={buttonVariants({ variant: "destructive" })}>
              {isDeleting ? <Loader className="mr-2 h-4 w-4 animate-spin" /> : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
