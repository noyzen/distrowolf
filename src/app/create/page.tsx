
"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from 'next/navigation';
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import type { LocalImage } from "@/lib/types";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { createContainer, listLocalImages } from "@/lib/distrobox";
import { HardDrive, Loader, CheckCircle, Layers, Clock, Download, Power, Server } from "lucide-react";
import { cn, getDistroIcon } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Switch } from "@/components/ui/switch";

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  image: z.string().min(1, "Please select an image."),
  homeMode: z.enum(["shared", "isolated"]).default("shared"),
  customHome: z.string().optional(),
  volumes: z.string().optional(),
  init: z.boolean().default(false),
  nvidia: z.boolean().default(false),
}).refine(data => {
    if (data.homeMode === 'isolated') {
        return !!data.customHome && data.customHome.length > 0;
    }
    return true;
}, {
    message: "A custom home path is required for isolated mode.",
    path: ["customHome"],
});

export default function CreateContainerPage() {
  const [localImages, setLocalImages] = useState<LocalImage[]>([]);
  const [loadingImages, setLoadingImages] = useState(true);
  const [isSubmitting, setSubmitting] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      image: "",
      homeMode: "shared",
      customHome: "",
      volumes: "",
      init: false,
      nvidia: false,
    },
  });

  const homeMode = form.watch("homeMode");

  useEffect(() => {
    async function fetchImages() {
      setLoadingImages(true);
      try {
        const images = await listLocalImages();
        setLocalImages(images);
      } catch (error: any) {
        toast({
          variant: "destructive",
          title: "Failed to load local images",
          description: error.message,
        });
      } finally {
        setLoadingImages(false);
      }
    }
    fetchImages();
  }, [toast]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setSubmitting(true);
    const volumesArray = values.volumes ? values.volumes.split("\n").filter((v:string) => v.trim() !== "") : [];
    
    let homePath = "";
    if (values.homeMode === 'isolated' && values.customHome) {
        homePath = values.customHome;
    }

    const newContainerData = { 
        name: values.name,
        image: values.image,
        home: homePath,
        volumes: volumesArray,
        init: values.init,
        nvidia: values.nvidia,
    };

    toast({
      title: "Creating container...",
      description: `Request sent to create "${newContainerData.name}". This might take some time.`,
    });

    try {
      await createContainer(newContainerData);
      toast({
        title: "Container created successfully!",
        description: `New container "${newContainerData.name}" has been set up.`,
      });
      router.push('/'); 
    } catch(error: any) {
        toast({
            variant: "destructive",
            title: "Failed to Create Container",
            description: error.message,
        });
    } finally {
        setSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <Card>
          <CardHeader>
            <CardTitle className="font-headline">Create New Container</CardTitle>
            <CardDescription>
              Configure and create a new Distrobox container.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Container Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., my-dev-env" {...field} />
                      </FormControl>
                       <FormDescription>A unique name for your container.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="homeMode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Home Directory</FormLabel>
                       <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          className="flex space-x-4 pt-2"
                        >
                          <FormItem className="flex items-center space-x-2">
                            <RadioGroupItem value="shared" id="r1" />
                            <FormLabel htmlFor="r1">Share Host Home</FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-2">
                            <RadioGroupItem value="isolated" id="r2" />
                            <FormLabel htmlFor="r2">Isolated Home</FormLabel>
                          </FormItem>
                        </RadioGroup>
                      </FormControl>
                      <FormDescription>Choose home directory isolation.</FormDescription>
                      <FormMessage/>
                    </FormItem>
                  )}
                />
            </div>

            {homeMode === 'isolated' && (
                 <FormField
                    control={form.control}
                    name="customHome"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Custom Home Path</FormLabel>
                        <FormControl>
                            <Input placeholder="/path/on/host/for/container/home" {...field} />
                        </FormControl>
                        <FormDescription>The host path to mount as the container's home directory.</FormDescription>
                        <FormMessage />
                        </FormItem>
                    )}
                 />
            )}
            
            <FormField
              control={form.control}
              name="image"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Base Image</FormLabel>
                  <FormDescription>Select a pre-downloaded image for your container.</FormDescription>
                  <div className="rounded-lg border bg-background/50 p-4">
                    <ScrollArea className="h-72 pr-4">
                        <FormControl>
                            <RadioGroup
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
                            >
                                {loadingImages ? (
                                   Array.from({ length: 6 }).map((_, i) => (
                                       <Skeleton key={i} className="h-28 w-full rounded-lg" />
                                   ))
                                ) : localImages.length > 0 ? (
                                    localImages.map((img) => (
                                        <FormItem key={img.id} className="relative">
                                            <FormControl>
                                                <RadioGroupItem value={`${img.repository}:${img.tag}`} id={img.id} className="peer sr-only" />
                                            </FormControl>
                                            <FormLabel htmlFor={img.id} className={cn(
                                                "flex flex-col items-start justify-between gap-2 rounded-lg border-2 border-muted bg-card p-3 h-full hover:bg-accent hover:text-accent-foreground cursor-pointer transition-all",
                                                "peer-data-[state=checked]:border-primary peer-data-[state=checked]:ring-2 peer-data-[state=checked]:ring-primary"
                                            )}>
                                                <div className="flex items-start gap-3 w-full">
                                                    <i className={cn(getDistroIcon(img.repository), "text-3xl text-muted-foreground pt-1")}></i>
                                                    <div className="flex flex-col items-start overflow-hidden w-full text-left">
                                                        <h3 className="font-semibold text-foreground truncate w-full" title={img.repository}>{img.repository}</h3>
                                                        <Badge variant="outline" className="font-mono mt-1">{img.tag}</Badge>
                                                    </div>
                                                    <CheckCircle className={cn("h-5 w-5 text-primary opacity-0 transition-opacity flex-shrink-0", field.value === `${img.repository}:${img.tag}` && "opacity-100")} />
                                                </div>
                                                <div className="flex items-center justify-between w-full text-xs text-muted-foreground mt-2 pt-2 border-t border-dashed">
                                                    <div className="flex items-center gap-1">
                                                        <Layers className="h-3 w-3" />
                                                        <span className="font-semibold">{img.size}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <Clock className="h-3 w-3" />
                                                        <span>{img.created}</span>
                                                    </div>
                                                </div>
                                            </FormLabel>
                                        </FormItem>
                                    ))
                                ) : null}
                            </RadioGroup>
                        </FormControl>
                    </ScrollArea>
                  </div>
                  {localImages.length === 0 && !loadingImages && (
                        <div className="text-center col-span-full p-8 border-2 border-dashed rounded-lg flex flex-col items-center justify-center">
                           <HardDrive className="mx-auto h-12 w-12 text-muted-foreground" />
                           <h3 className="mt-4 text-lg font-semibold">No Local Images Found</h3>
                           <p className="text-muted-foreground">Go to the "Download Images" page to pull an image first.</p>
                           <Button asChild variant="outline" className="mt-4">
                            <Link href="/download">
                                <Download className="mr-2 h-4 w-4" />
                                Go to Downloads
                            </Link>
                           </Button>
                        </div>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />
             <div className="space-y-4">
                <h3 className="text-lg font-medium">Advanced Options</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 rounded-lg border p-4">
                     <FormField
                        control={form.control}
                        name="init"
                        render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg bg-background/50">
                                <div className="space-y-0.5">
                                <FormLabel className="text-base flex items-center gap-2">
                                    <Power className="h-5 w-5 text-primary" />
                                    Enable Init (systemd)
                                </FormLabel>
                                <FormDescription>
                                    Use an init system like systemd inside the container.
                                </FormDescription>
                                </div>
                                <FormControl>
                                <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                />
                                </FormControl>
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="nvidia"
                        render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg bg-background/50">
                                 <div className="space-y-0.5">
                                <FormLabel className="text-base flex items-center gap-2">
                                     <Server className="h-5 w-5 text-primary" />
                                    Enable NVIDIA GPU
                                </FormLabel>
                                <FormDescription>
                                    Share the host's NVIDIA GPU with the container.
                                </FormDescription>
                                </div>
                                <FormControl>
                                <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                />
                                </FormControl>
                            </FormItem>
                        )}
                    />
                </div>
            </div>
            
            <FormField
              control={form.control}
              name="volumes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mount Volumes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="e.g., /path/on/host:/path/in/container"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>One volume mount per line. Your home directory is handled above.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter className="flex justify-end">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader className="mr-2 h-4 w-4 animate-spin" />}
                Create Container
              </Button>
          </CardFooter>
        </Card>
      </form>
    </Form>
  );
}

    