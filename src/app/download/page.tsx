
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Download, Loader, Rocket } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { pullImage } from "@/lib/distrobox";

const popularImages = [
  "ubuntu:latest",
  "fedora:latest",
  "archlinux:latest",
  "debian:latest",
  "alpine:latest",
  "opensuse/tumbleweed:latest",
  "quay.io/toolbx/fedora-toolbox:38",
  "quay.io/toolbx/ubuntu-toolbox:22.04"
];

const formSchema = z.object({
  imageName: z.string().min(1, "Image name cannot be empty."),
});

export default function DownloadPage() {
  const { toast } = useToast();
  const [isDownloading, setIsDownloading] = useState(false);
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      imageName: "",
    },
  });

  const handleSelectChange = (value: string) => {
    form.setValue("imageName", value);
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
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardHeader>
              <CardTitle className="font-headline">Download Image</CardTitle>
              <CardDescription>
                Download a new container image from an official registry.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <FormLabel>From popular registries</FormLabel>
                <Select onValueChange={handleSelectChange}>
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
              <FormField
                control={form.control}
                name="imageName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>From a custom registry URL</FormLabel>
                    <FormControl>
                      <Input placeholder="docker.io/library/ubuntu:latest" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={isDownloading}>
                {isDownloading ? <Loader className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                Download Image
              </Button>
            </CardContent>
          </form>
        </Form>
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
