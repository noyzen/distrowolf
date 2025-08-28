"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { MOCK_LOCAL_IMAGES } from "@/lib/mock-data";
import { Download, Upload, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function ImagesPage() {
  const { toast } = useToast();
  
  const handleAction = (title: string, description: string) => {
    toast({ title, description });
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="font-headline">Local Images</CardTitle>
            <CardDescription>
              Manage container images available on your local machine.
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => handleAction("Import Image", "Please select a .tar file to import.")}><Upload className="mr-2 h-4 w-4" /> Import Image</Button>
          </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Repository</TableHead>
              <TableHead>Tag</TableHead>
              <TableHead>Size</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right w-[100px]">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {MOCK_LOCAL_IMAGES.map((image) => (
              <TableRow key={image.id}>
                <TableCell className="font-medium">{image.repository}</TableCell>
                <TableCell>{image.tag}</TableCell>
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
                        <DropdownMenuItem onClick={() => handleAction("Exporting Image", `Exporting ${image.repository}:${image.tag}...`)}>
                          <Download className="mr-2 h-4 w-4" />
                          <span>Export (.tar)</span>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive focus:text-destructive-foreground focus:bg-destructive" onClick={() => handleAction("Deleting Image", `Image ${image.repository}:${image.tag} deleted.`)}>
                          <Trash2 className="mr-2 h-4 w-4" />
                          <span>Delete Image</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
