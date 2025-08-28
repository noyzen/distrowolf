"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Download, Rocket } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

const popularImages = [
  "ubuntu:latest",
  "fedora:latest",
  "archlinux:latest",
  "debian:latest",
  "alpine:latest"
];

export default function DownloadPage() {
  const { toast } = useToast();

  const handleDownload = () => {
    toast({
      title: "Image Download Started",
      description: "Your new container image is being downloaded.",
    });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
        <Card>
            <CardHeader>
                <CardTitle className="font-headline">Download Image</CardTitle>
                <CardDescription>
                Download a new container image from an official registry or a custom URL.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <label className="text-sm font-medium">From popular registries</label>
                    <Select>
                        <SelectTrigger>
                            <SelectValue placeholder="Select a popular image" />
                        </SelectTrigger>
                        <SelectContent>
                            {popularImages.map(image => (
                                <SelectItem key={image} value={image}>{image}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                 <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-background px-2 text-muted-foreground">Or</span>
                    </div>
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium">From custom URL</label>
                    <Input placeholder="docker.io/library/ubuntu:latest" />
                </div>
                <Button className="w-full" onClick={handleDownload}>
                    <Download className="mr-2 h-4 w-4" />
                    Download Image
                </Button>
            </CardContent>
        </Card>
        <Card className="flex flex-col items-center justify-center p-6 bg-accent/10 border-dashed">
            <Rocket className="h-16 w-16 text-primary mb-4" />
            <h3 className="text-xl font-headline text-center">Ready for Liftoff?</h3>
            <p className="text-muted-foreground text-center mt-2">
                Download a new image to start building your next containerized environment.
            </p>
        </Card>
    </div>
  );
}
