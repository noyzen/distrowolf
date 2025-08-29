
"use client";

import React, { type ReactNode, useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  Boxes,
  Download,
  HardDrive,
  Wrench,
  PlusCircle,
  Search,
  PanelLeft,
  Loader
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { useSearch } from "@/hooks/use-search";
import { AnimatePresence, motion } from "framer-motion";
import { useIsMobile } from "@/hooks/use-mobile";
import { Logo } from "@/components/ui/logo";
import { Button } from "./ui/button";

const navItems = [
  { href: "/create", label: "Create New", icon: PlusCircle },
  { href: "/", label: "My Containers", icon: Boxes },
  { href: "/images", label: "Local Images", icon: HardDrive },
  { href: "/download", label: "Download Images", icon: Download },
  { href: "/system", label: "System & Info", icon: Wrench },
];


export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { searchTerm, setSearchTerm } = useSearch();
  const isMobile = useIsMobile();
  const { setOpenMobile, toggleSidebar } = useSidebar();

  useEffect(() => {
    if (pathname && isMobile) {
        setOpenMobile(false);
    }
  }, [pathname, isMobile, setOpenMobile]);

  const currentPage = navItems.find((item) => {
    if (item.href === '/') return pathname === '/';
    return pathname.startsWith(item.href) && (pathname.length === item.href.length || pathname[item.href.length] === '/');
  }) ?? navItems.find(item => item.href === '/'); 

  const isSearchablePage = pathname === '/' || pathname === '/images';

  return (
    <>
      <Sidebar>
        <SidebarHeader className="p-4">
          <div className="flex flex-col items-center justify-center gap-4 text-center">
            <Logo className="h-24 w-24 text-primary" />
            <h1 className="font-headline text-2xl font-semibold text-primary">
              DistroWolf
            </h1>
          </div>
        </SidebarHeader>
        <SidebarContent className="p-4">
          <SidebarMenu>
            {navItems.map((item) => (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  asChild
                  isActive={currentPage?.href === item.href}
                  tooltip={item.label}
                  prefetch={false}
                >
                <Link href={item.href}>
                  <item.icon />
                  <span>{item.label}</span>
                </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>
      </Sidebar>
      <SidebarInset>
        <header className="flex h-14 items-center gap-4 border-b bg-background/50 backdrop-blur-sm px-6 sticky top-0 z-30">
           <div className="md:hidden">
              <Button variant="ghost" onClick={toggleSidebar} className="px-2">
                <PanelLeft className="h-5 w-5" />
                <span className="ml-2">Menu</span>
              </Button>
            </div>
          <div className="flex-1">
            <h1 className="font-headline text-xl font-semibold">
              {currentPage?.label || "Dashboard"}
            </h1>
          </div>
          {isSearchablePage && (
            <div className="relative ml-auto flex-1 md:grow-0">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-lg bg-background pl-8 md:w-[200px] lg:w-[320px]"
              />
            </div>
          )}
        </header>
        <main className="flex-1 p-4 sm:p-6 relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </SidebarInset>
    </>
  );
}
