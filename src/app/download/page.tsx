
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Download, Loader, Star, Boxes, Factory, Globe, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { pullImage, cancelPullImage } from "@/lib/distrobox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn, getDistroIcon } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";

const imageCategories = {
    "Featured": [
        { name: "Ubuntu", image: "quay.io/toolbx/ubuntu-toolbox:24.04", description: "Modern, popular, and versatile." },
        { name: "Fedora", image: "quay.io/fedora/fedora-toolbox:40", description: "Cutting-edge with strong community support." },
        { name: "Arch Linux", image: "quay.io/toolbx/arch-toolbox:latest", description: "Rolling-release, for experienced users." },
        { name: "Debian", image: "quay.io/toolbx-images/debian-toolbox:12", description: "The rock-solid stable distribution." },
        { name: "Ublue Toolbox", image: "ghcr.io/ublue-os/toolbox:latest", description: "Fedora-based for immutable systems." },
        { name: "Alpine", image: "quay.io/toolbx-images/alpine-toolbox:latest", description: "Extremely lightweight and secure." },
    ],
    "General Purpose": {
        "Ubuntu": [
            "quay.io/toolbx/ubuntu-toolbox:25.04",
            "quay.io/toolbx/ubuntu-toolbox:24.04",
            "quay.io/toolbx/ubuntu-toolbox:22.04",
            "quay.io/toolbx/ubuntu-toolbox:20.04"
        ],
        "Fedora": [
            "quay.io/fedora/fedora-toolbox:42",
            "quay.io/fedora/fedora-toolbox:41",
            "registry.fedoraproject.org/fedora-toolbox:40",
            "registry.fedoraproject.org/fedora-toolbox:39"
        ],
        "Debian": [
            "quay.io/toolbx-images/debian-toolbox:13",
            "quay.io/toolbx-images/debian-toolbox:12",
            "quay.io/toolbx-images/debian-toolbox:11",
            "quay.io/toolbx-images/debian-toolbox:10"
        ],
        "openSUSE": ["registry.opensuse.org/opensuse/distrobox:latest"],
        "Archlinux": ["quay.io/toolbx/arch-toolbox:latest"],
        "Alpine": [
            "quay.io/toolbx-images/alpine-toolbox:3.22",
            "quay.io/toolbx-images/alpine-toolbox:3.21",
            "quay.io/toolbx-images/alpine-toolbox:3.20",
            "quay.io/toolbx-images/alpine-toolbox:3.19"
        ],
    },
    "Enterprise & Stable": {
        "RedHat": [
            "registry.access.redhat.com/ubi9/toolbox",
            "registry.access.redhat.com/ubi8/toolbox"
        ],
        "AlmaLinux": [
            "quay.io/toolbx-images/almalinux-toolbox:9",
            "quay.io/toolbx-images/almalinux-toolbox:8"
        ],
        "Rocky Linux": [
            "quay.io/toolbx-images/rockylinux-toolbox:9",
            "quay.io/toolbx-images/rockylinux-toolbox:8"
        ],
        "CentOS": [
            "quay.io/toolbx-images/centos-toolbox:stream9",
            "quay.io/toolbx-images/centos-toolbox:stream8"
        ],
        "AmazonLinux": [
            "quay.io/toolbx-images/amazonlinux-toolbox:2023",
            "quay.io/toolbx-images/amazonlinux-toolbox:2"
        ],
    },
    "Specialized & Immutable": {
        "Ublue Variants": [
            "ghcr.io/ublue-os/bluefin-cli:latest",
            "ghcr.io/ublue-os/bazzite-arch:latest",
            "ghcr.io/ublue-os/ubuntu-toolbox:latest",
            "ghcr.io/ublue-os/fedora-toolbox:latest",
            "ghcr.io/ublue-os/wolfi-toolbox:latest",
            "ghcr.io/ublue-os/archlinux-distrobox:latest"
        ],
        "Wolfi": ["quay.io/toolbx-images/wolfi-toolbox:latest"],
    }
};

const formSchema = z.object({
  imageName: z.string().min(1, "Image name cannot be empty."),
});

const FeaturedImageCard = ({ name, image, description, onSelect, isSelected }: { name: string, image: string, description: string, onSelect: (img: string) => void, isSelected: boolean }) => {
     return (
        <button type="button" onClick={() => onSelect(image)} className={cn("p-4 border rounded-lg text-left hover:border-primary transition-all relative flex flex-col justify-between h-36", isSelected && "border-primary ring-2 ring-primary bg-primary/10")}>
            <div className="flex items-center gap-3">
                 <i className={cn(getDistroIcon(name), "text-4xl text-muted-foreground")}></i>
                <div>
                    <p className="font-semibold text-lg truncate">{name}</p>
                    <p className="text-sm text-muted-foreground">{description}</p>
                </div>
            </div>
            <p className="text-xs text-muted-foreground font-mono mt-1 truncate">{image}</p>
        </button>
    );
};
  
const ImageCard = ({ image, onSelect, isSelected }: { image: string, onSelect: (img: string) => void, isSelected: boolean }) => {
    return (
        <button type="button" onClick={() => onSelect(image)} className={cn("p-4 border rounded-lg text-left hover:border-primary transition-all relative flex items-center gap-3", isSelected && "border-primary ring-2 ring-primary bg-primary/10")}>
            <i className={cn(getDistroIcon(image), "text-3xl text-muted-foreground")}></i>
            <p className="font-semibold truncate font-mono text-sm">{image}</p>
        </button>
    );
};

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
      const result = await pullImage(values.imageName);
      if (result.cancelled) {
        toast({
            title: "Download Cancelled",
            description: `Pull for image ${values.imageName} was cancelled.`,
        });
      } else {
        toast({
            title: "Download Complete!",
            description: `Successfully pulled ${values.imageName}. It is now available when creating a new container.`,
        });
        form.reset();
        setSelectedImage(null);
      }
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

  const handleCancelPull = async () => {
    const imageName = form.getValues("imageName");
    if (!imageName || !isDownloading) return;

    try {
      await cancelPullImage(imageName);
      // No toast here, the onSubmit handler will show the cancelled toast
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Failed to Cancel",
        description: error.message || "Could not cancel the download.",
      });
      setIsDownloading(false); // Reset state on cancellation error
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
            <div className="p-4 border rounded-lg bg-background/50">
              <FormField
                control={form.control}
                name="imageName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Custom Image URL</FormLabel>
                     <div className="flex flex-col sm:flex-row gap-4">
                        <FormControl>
                            <Input 
                            placeholder="docker.io/library/ubuntu:latest" 
                            {...field} 
                            onChange={handleInputChange}
                            disabled={isDownloading}
                            />
                        </FormControl>
                        {isDownloading ? (
                          <Button type="button" variant="destructive" onClick={handleCancelPull} className="flex-shrink-0">
                              <XCircle className="mr-2 h-4 w-4" /> Cancel
                          </Button>
                        ) : (
                          <Button type="submit" className="flex-shrink-0" disabled={!form.getValues("imageName")}>
                              <Download className="mr-2 h-4 w-4" /> Download
                          </Button>
                        )}
                    </div>
                    {isDownloading && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
                        <Loader className="h-4 w-4 animate-spin" />
                        <span>Pulling image... this can take a while depending on the size and your network speed.</span>
                      </div>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">Or select from a list</span>
              </div>
            </div>

            <Tabs defaultValue="featured" className="w-full">
              <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 h-auto">
                <TabsTrigger value="featured"><Star className="w-4 h-4 mr-2"/>Featured</TabsTrigger>
                <TabsTrigger value="general"><Boxes className="w-4 h-4 mr-2"/>General</TabsTrigger>
                <TabsTrigger value="enterprise"><Factory className="w-4 h-4 mr-2"/>Enterprise</TabsTrigger>
                <TabsTrigger value="specialized"><Globe className="w-4 h-4 mr-2"/>Specialized</TabsTrigger>
              </TabsList>
              <ScrollArea className="h-[450px] pr-4 pt-4">
                <TabsContent value="featured" className="mt-0">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {imageCategories["Featured"].map((item) => (
                            <FeaturedImageCard key={item.image} name={item.name} image={item.image} description={item.description} onSelect={handleImageSelect} isSelected={selectedImage === item.image} />
                        ))}
                    </div>
                </TabsContent>
                <TabsContent value="general" className="mt-0 space-y-6">
                    {Object.entries(imageCategories["General Purpose"]).map(([distro, images]) => (
                        <div key={distro}>
                            <h3 className="font-semibold text-lg mb-2">{distro}</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {images.map(image => (
                                    <ImageCard key={image} image={image} onSelect={handleImageSelect} isSelected={selectedImage === image} />
                                ))}
                            </div>
                        </div>
                    ))}
                </TabsContent>
                <TabsContent value="enterprise" className="mt-0 space-y-6">
                    {Object.entries(imageCategories["Enterprise & Stable"]).map(([distro, images]) => (
                        <div key={distro}>
                            <h3 className="font-semibold text-lg mb-2">{distro}</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {images.map(image => (
                                    <ImageCard key={image} image={image} onSelect={handleImageSelect} isSelected={selectedImage === image} />
                                ))}
                            </div>
                        </div>
                    ))}
                </TabsContent>
                <TabsContent value="specialized" className="mt-0 space-y-6">
                    {Object.entries(imageCategories["Specialized & Immutable"]).map(([distro, images]) => (
                        <div key={distro}>
                            <h3 className="font-semibold text-lg mb-2">{distro}</h3>
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {images.map(image => (
                                    <ImageCard key={image} image={image} onSelect={handleImageSelect} isSelected={selectedImage === image} />
                                ))}
                            </div>
                        </div>
                    ))}
                </TabsContent>
              </ScrollArea>
            </Tabs>
          </CardContent>
        </form>
      </Form>
    </Card>
  );
}
