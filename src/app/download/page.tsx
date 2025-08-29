
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Download, Loader, Server, Star } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { pullImage } from "@/lib/distrobox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

const imageCategories = {
    "Featured": [
        { name: "Ubuntu", image: "quay.io/toolbx/ubuntu-toolbox:24.04", tags: ["General", "Debian"] },
        { name: "Fedora", image: "quay.io/fedora/fedora-toolbox:40", tags: ["General", "RPM"] },
        { name: "Arch Linux", image: "quay.io/toolbx/arch-toolbox:latest", tags: ["General", "Rolling"] },
        { name: "Debian", image: "quay.io/toolbx-images/debian-toolbox:12", tags: ["General", "Stable"] },
        { name: "Ublue Toolbox", image: "ghcr.io/ublue-os/toolbox:latest", tags: ["Immutable", "Fedora"] },
        { name: "Alpine", image: "quay.io/toolbx-images/alpine-toolbox:latest", tags: ["Minimal", "Lightweight"] },
    ],
    "General Purpose": [
        "quay.io/toolbx/ubuntu-toolbox:25.04",
        "quay.io/toolbx/ubuntu-toolbox:24.04",
        "quay.io/toolbx/ubuntu-toolbox:22.04",
        "quay.io/fedora/fedora-toolbox:42",
        "quay.io/fedora/fedora-toolbox:41",
        "registry.fedoraproject.org/fedora-toolbox:40",
        "quay.io/toolbx-images/debian-toolbox:13",
        "quay.io/toolbx-images/debian-toolbox:12",
        "quay.io/toolbx/arch-toolbox:latest",
        "registry.opensuse.org/opensuse/distrobox:latest",
    ],
    "Enterprise & Stable": [
        "quay.io/toolbx-images/almalinux-toolbox:9",
        "quay.io/toolbx-images/rockylinux-toolbox:9",
        "quay.io/toolbx-images/centos-toolbox:stream9",
        "registry.access.redhat.com/ubi9/toolbox",
        "quay.io/toolbx-images/amazonlinux-toolbox:2023",
    ],
    "Immutable & Specialized": [
        "ghcr.io/ublue-os/bluefin-cli:latest",
        "ghcr.io/ublue-os/bazzite-arch:latest",
        "ghcr.io/ublue-os/ubuntu-toolbox:latest",
        "ghcr.io/ublue-os/fedora-toolbox:latest",
        "ghcr.io/ublue-os/wolfi-toolbox:latest",
        "quay.io/toolbx-images/wolfi-toolbox:latest",
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
  
  const ImageCard = ({ image, onSelect, isSelected }: { image: string, onSelect: (img: string) => void, isSelected: boolean }) => {
    const [name, tag] = image.split(':');
    const repo = name.substring(0, name.lastIndexOf('/'));
    const imageName = name.substring(name.lastIndexOf('/') + 1);

    return (
        <button type="button" onClick={() => onSelect(image)} className={cn("p-4 border rounded-lg text-left hover:border-primary transition-all relative", isSelected && "border-primary ring-2 ring-primary bg-primary/10")}>
            <p className="font-semibold truncate">{imageName}</p>
            <p className="text-xs text-muted-foreground truncate">{repo}</p>
            <p className="text-xs text-muted-foreground font-mono mt-1">{tag || 'latest'}</p>
        </button>
    );
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
            <Tabs defaultValue="featured" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="featured"><Star className="w-4 h-4 mr-2"/>Featured</TabsTrigger>
                <TabsTrigger value="general">General</TabsTrigger>
                <TabsTrigger value="enterprise">Enterprise</TabsTrigger>
                <TabsTrigger value="specialized">Specialized</TabsTrigger>
              </TabsList>
              <TabsContent value="featured" className="pt-4">
                 <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {imageCategories["Featured"].map(({image}) => (
                        <ImageCard key={image} image={image} onSelect={handleImageSelect} isSelected={selectedImage === image} />
                    ))}
                 </div>
              </TabsContent>
              <TabsContent value="general" className="pt-4">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {imageCategories["General Purpose"].map(image => (
                    <ImageCard key={image} image={image} onSelect={handleImageSelect} isSelected={selectedImage === image} />
                  ))}
                </div>
              </TabsContent>
               <TabsContent value="enterprise" className="pt-4">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {imageCategories["Enterprise & Stable"].map(image => (
                     <ImageCard key={image} image={image} onSelect={handleImageSelect} isSelected={selectedImage === image} />
                  ))}
                </div>
              </TabsContent>
              <TabsContent value="specialized" className="pt-4">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {imageCategories["Immutable & Specialized"].map(image => (
                    <ImageCard key={image} image={image} onSelect={handleImageSelect} isSelected={selectedImage === image} />
                  ))}
                </div>
              </TabsContent>
            </Tabs>
            
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">Or</span>
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
