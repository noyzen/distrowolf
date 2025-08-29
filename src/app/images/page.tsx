
"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Upload, Trash2, Download, RefreshCw, Loader, HardDrive, MoreHorizontal } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { listLocalImages, deleteImage } from "@/lib/distrobox";
import type { LocalImage } from "@/lib/types";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { buttonVariants } from "@/components/ui/button";

export default function ImagesPage() {
  const { toast } = useToast();
  const [localImages, setLocalImages] = useState<LocalImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [imageToDelete, setImageToDelete] = useState<LocalImage | null>(null);

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

  const handleAction = (title: string, description: string) => {
    toast({ title, description });
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="font-headline">Local Images</CardTitle>
            <CardDescription>
              Manage container images available on your local machine.
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={fetchImages} disabled={loading}>
              {loading ? <Loader className="mr-2 h-4 w-4 animate-spin"/> : <RefreshCw className="mr-2 h-4 w-4" />} Refresh
            </Button>
            <Button variant="outline" onClick={() => handleAction("Import Not Implemented", "This feature requires a native file picker, which is not yet implemented.")}>
              <Upload className="mr-2 h-4 w-4" /> Import Image
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Repository</TableHead>
                <TableHead>Tag</TableHead>
                <TableHead>Image ID</TableHead>
                <TableHead>Size</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right w-[100px]">Action</TableHead>
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
              ) : localImages.length > 0 ? (
                localImages.map((image) => (
                  <TableRow key={image.id}>
                    <TableCell className="font-medium">{image.repository}</TableCell>
                    <TableCell>{image.tag}</TableCell>
                    <TableCell className="font-mono text-xs">{image.imageID.substring(0, 12)}</TableCell>
                    <TableCell>{image.size}</TableCell>
                    <TableCell className="text-muted-foreground">{image.created}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleAction("Export Not Implemented", "This feature requires a native file picker, which is not yet implemented.")}>
                            <Download className="mr-2 h-4 w-4" />
                            <span>Export (.tar)</span>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive focus:text-destructive-foreground focus:bg-destructive" onClick={() => handleDeleteConfirm(image)}>
                            {isDeleting === image.id ? <Loader className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
                            <span>Delete Image</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
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
                        <p className="text-muted-foreground">Download an image or pull one using podman.</p>
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
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
