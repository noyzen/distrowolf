
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Download, Loader } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { pullImage } from "@/lib/distrobox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

const imageCategories = {
    "General Purpose": [
        "ubuntu:latest",
        "fedora:latest",
        "debian:stable-slim",
        "archlinux:latest",
        "opensuse/tumbleweed:latest",
        "alpine:latest",
    ],
    "Development Toolboxes": [
        "quay.io/toolbx/fedora-toolbox:latest",
        "quay.io/toolbx/ubuntu-toolbox:22.04",
        "registry.access.redhat.com/ubi9/toolbox:latest"
    ],
    "Immutable OS Toolboxes": [
        "ghcr.io/ublue-os/toolbox:latest",
        "ghcr.io/vanilla-os/first-setup-toolbox:2"
    ],
    "Specialized": [
        "kalilinux/kali-rolling:latest",
        "continuumio/miniconda3:latest",
        "docker.io/amazonlinux:latest"
    ]
};

const formSchema = z.object({
  imageName: z.string().min(1, "Image name cannot be empty."),
});

export default function DownloadPage() {
  const { toast } = useToast();
  const [isDownloading, setIsDownloading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      imageName: "",
    },
  });

  const handleImageSelect = (image: string) => {
    setSelectedImage(image);
    form.setValue("imageName", image);
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    form.setValue("imageName", value);
    if (selectedImage && value !== selectedImage) {
      setSelectedImage(null);
    }
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsDownloading(true);
    toast({
      title: "Image Download Started",
      description: `Pulling image: ${values.imageName}. This may take some time.`,
    });

    try {
      await pullImage(values.imageName);
      toast({
        title: "Download Complete!",
        description: `Successfully pulled ${values.imageName}. It is now available when creating a new container.`,
      });
      form.reset();
      setSelectedImage(null);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Download Failed",
        description: error.message || `Could not pull image ${values.imageName}. Check the name and try again.`,
      });
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <Card>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardHeader>
            <CardTitle className="font-headline">Download Container Image</CardTitle>
            <CardDescription>
              Select a popular image from the list or enter a custom URL to download it from a registry.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Tabs defaultValue="general" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="general">General</TabsTrigger>
                <TabsTrigger value="dev">Development</TabsTrigger>
                <TabsTrigger value="immutable">Immutable</TabsTrigger>
                <TabsTrigger value="specialized">Specialized</TabsTrigger>
              </TabsList>
              <TabsContent value="general">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pt-4">
                  {imageCategories["General Purpose"].map(image => (
                    <button type="button" key={image} onClick={() => handleImageSelect(image)} className={cn("p-4 border rounded-lg text-left hover:border-primary transition-all", selectedImage === image && "border-primary ring-2 ring-primary")}>
                      <p className="font-semibold truncate">{image.split('/')[image.split('/').length-1]}</p>
                      <p className="text-xs text-muted-foreground truncate">{image.split('/')[0]}</p>
                    </button>
                  ))}
                </div>
              </TabsContent>
               <TabsContent value="dev">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pt-4">
                  {imageCategories["Development Toolboxes"].map(image => (
                     <button type="button" key={image} onClick={() => handleImageSelect(image)} className={cn("p-4 border rounded-lg text-left hover:border-primary transition-all", selectedImage === image && "border-primary ring-2 ring-primary")}>
                      <p className="font-semibold truncate">{image.split('/')[image.split('/').length-1]}</p>
                      <p className="text-xs text-muted-foreground truncate">{image.split('/')[0]}</p>
                    </button>
                  ))}
                </div>
              </TabsContent>
              <TabsContent value="immutable">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pt-4">
                  {imageCategories["Immutable OS Toolboxes"].map(image => (
                     <button type="button" key={image} onClick={() => handleImageSelect(image)} className={cn("p-4 border rounded-lg text-left hover:border-primary transition-all", selectedImage === image && "border-primary ring-2 ring-primary")}>
                      <p className="font-semibold truncate">{image.split('/')[image.split('/').length-1]}</p>
                      <p className="text-xs text-muted-foreground truncate">{image.split('/')[0]}</p>
                    </button>
                  ))}
                </div>
              </TabsContent>
              <TabsContent value="specialized">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pt-4">
                  {imageCategories["Specialized"].map(image => (
                    <button type="button" key={image} onClick={() => handleImageSelect(image)} className={cn("p-4 border rounded-lg text-left hover:border-primary transition-all", selectedImage === image && "border-primary ring-2 ring-primary")}>
                      <p className="font-semibold truncate">{image.split('/')[image.split('/').length-1]}</p>
                      <p className="text-xs text-muted-foreground truncate">{image.split('/')[0]}</p>
                    </button>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
            
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Or</span>
              </div>
            </div>

            <FormField
              control={form.control}
              name="imageName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Custom Image URL</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="docker.io/library/ubuntu:latest" 
                      {...field} 
                      onChange={handleInputChange}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={isDownloading || !form.getValues("imageName")}>
              {isDownloading ? <Loader className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
              Download Image
            </Button>
          </CardContent>
        </form>
      </Form>
    </Card>
  );
}
