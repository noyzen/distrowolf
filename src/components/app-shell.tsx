
"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
  SidebarTrigger,
  SidebarFooter,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import {
  Boxes,
  Download,
  HardDrive,
  Settings,
  Box,
  Wrench,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";


const navItems = [
  { href: "/", label: "Containers", icon: Boxes },
  { href: "/images", label: "Images", icon: HardDrive },
  { href: "/download", label: "Download", icon: Download },
];

const systemNavItems = [
    { href: "/system", label: "System", icon: Wrench },
]

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  const allNavItems = [...navItems, ...systemNavItems];
  const currentPage = allNavItems.find((item) => {
    if (item.href === '/') return pathname === '/';
    return pathname.startsWith(item.href);
  });

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/20 rounded-lg">
              <Box className="text-primary h-6 w-6" />
            </div>
            <h1 className="font-headline text-2xl font-semibold text-primary">
              DistroWolf
            </h1>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            {navItems.map((item) => (
              <SidebarMenuItem key={item.href}>
                <Link href={item.href}>
                  <SidebarMenuButton
                    isActive={currentPage?.href === item.href}
                    tooltip={item.label}
                  >
                    <item.icon />
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>
         <SidebarFooter className="p-4 space-y-4 mt-auto">
           <SidebarMenu>
             {systemNavItems.map((item) => (
              <SidebarMenuItem key={item.href}>
                <Link href={item.href}>
                  <SidebarMenuButton
                    isActive={currentPage?.href === item.href}
                    tooltip={item.label}
                  >
                    <item.icon />
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
            ))}
           </SidebarMenu>
          <SidebarSeparator />
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarImage src="https://picsum.photos/100" data-ai-hint="profile picture" alt="User" />
              <AvatarFallback>U</AvatarFallback>
            </Avatar>
            <div className="flex flex-col overflow-hidden">
              <span className="font-semibold truncate">User</span>
              <span className="text-xs text-muted-foreground truncate">
                user@distrowolf.dev
              </span>
            </div>
            <Button variant="ghost" size="icon" className="ml-auto flex-shrink-0">
              <Settings className="h-5 w-5" />
            </Button>
          </div>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="flex h-14 items-center gap-4 border-b bg-background/50 backdrop-blur-sm px-6 sticky top-0 z-30">
          <SidebarTrigger className="md:hidden" />
          <div className="flex-1">
            <h1 className="font-headline text-xl font-semibold">
              {currentPage?.label || "Dashboard"}
            </h1>
          </div>
        </header>
        <main className="flex-1 p-4 sm:p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
