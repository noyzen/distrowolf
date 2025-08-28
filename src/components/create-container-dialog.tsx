"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { MOCK_LOCAL_IMAGES } from "@/lib/mock-data";
import type { Container } from "@/lib/types";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  image: z.string().min(1, "Please select an image."),
  sharedHome: z.boolean().default(false),
  init: z.boolean().default(false),
  nvidia: z.boolean().default(false),
  volumes: z.string().optional(),
});

type CreateContainerDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (data: Omit<Container, "id" | "size" | "status">) => void;
};

export function CreateContainerDialog({
  open,
  onOpenChange,
  onCreate,
}: CreateContainerDialogProps) {
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

  function onSubmit(values: z.infer<typeof formSchema>) {
    const volumesArray = values.volumes
      ? values.volumes.split("\n").filter((v) => v.trim() !== "")
      : [];
    onCreate({
      name: values.name,
      image: values.image,
      autostart: false, // Default value
      sharedHome: values.sharedHome,
      init: values.init,
      nvidia: values.nvidia,
      volumes: volumesArray,
    });
    onOpenChange(false);
    form.reset();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle className="font-headline">Create New Container</DialogTitle>
          <DialogDescription>
            Configure and create a new Distrobox container.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Container Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., my-dev-env" {...field} />
                  </FormControl>
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
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select an image" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {MOCK_LOCAL_IMAGES.map((img) => (
                        <SelectItem
                          key={img.id}
                          value={`${img.repository}:${img.tag}`}
                        >
                          {img.repository}:{img.tag}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="sharedHome"
                render={({ field }) => (
                  <FormItem className="flex flex-col items-center justify-center space-y-2 rounded-lg border p-4">
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
                  <FormItem className="flex flex-col items-center justify-center space-y-2 rounded-lg border p-4">
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
                  <FormItem className="flex flex-col items-center justify-center space-y-2 rounded-lg border p-4">
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
            <DialogFooter>
              <Button
                type="button"
                variant="ghost"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit">Create</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
