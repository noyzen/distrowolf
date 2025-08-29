
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
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
import { Loader } from "lucide-react";

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  image: z.string().min(1, "Please select an image."),
  sharedHome: z.boolean().default(false),
  init: z.boolean().default(false),
  nvidia: z.boolean().default(false),
  volumes: z.string().optional(),
});

export default function CreateContainerPage() {
  const [localImages, setLocalImages] = useState<LocalImage[]>([]);
  const [loadingImages, setLoadingImages] = useState(true);
  const [isSubmitting, setSubmitting] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

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

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      image: "",
      sharedHome: true,
      init: false,
      nvidia: false,
      volumes: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setSubmitting(true);
    const volumesArray = values.volumes ? values.volumes.split("\n").filter((v:string) => v.trim() !== "") : [];
    const newContainerData = { ...values, volumes: volumesArray };

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
      router.push('/'); // Redirect to the main page after creation
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
              Configure and create a new Distrobox container. It will be available on the 'My Containers' page once created.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
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
              name="image"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Base Image</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={loadingImages || localImages.length === 0}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={loadingImages ? "Loading local images..." : "Select an image"} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {localImages.length > 0 ? localImages.map((img) => (
                        <SelectItem
                          key={img.id}
                          value={`${img.repository}:${img.tag}`}
                        >
                          {img.repository}:{img.tag} ({img.size})
                        </SelectItem>
                      )) : (
                        <SelectItem value="none" disabled>No local images found. Go to 'Download Images' first.</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  <FormDescription>The container image to build from. Images must be available locally.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="space-y-2">
                 <FormLabel>Flags</FormLabel>
                 <FormDescription>Common flags for container creation.</FormDescription>
                 <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                    <FormField
                        control={form.control}
                        name="sharedHome"
                        render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <FormLabel htmlFor="shared-home">Shared Home</FormLabel>
                            <FormControl>
                            <Switch
                                id="shared-home"
                                checked={field.value}
                                onCheckedChange={field.onChange}
                            />
                            </FormControl>
                        </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="init"
                        render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <FormLabel htmlFor="init-flag">Use Init</FormLabel>
                            <FormControl>
                            <Switch
                                id="init-flag"
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
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <FormLabel htmlFor="nvidia-gpu">Nvidia GPU</FormLabel>
                            <FormControl>
                            <Switch
                                id="nvidia-gpu"
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
                  <FormDescription>One volume mount per line.</FormDescription>
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
