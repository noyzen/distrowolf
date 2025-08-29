
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
  Shield,
  Loader
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { useSearch } from "@/hooks/use-search";
import { AnimatePresence, motion } from "framer-motion";
import { useIsMobile } from "@/hooks/use-mobile";

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
  const [isNavigating, setIsNavigating] = useState(false);
  const isMobile = useIsMobile();
  const { setOpenMobile } = useSidebar();

  useEffect(() => {
    if (pathname) {
        setIsNavigating(true);
        const timer = setTimeout(() => {
            setIsNavigating(false);
            if (isMobile) {
                setOpenMobile(false);
            }
        }, 500); 
        return () => clearTimeout(timer);
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
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/20 rounded-lg">
                <Shield className="h-6 w-6 text-primary" />
            </div>
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
                >
                <Link href={item.href} prefetch={false}>
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
          <SidebarTrigger className="md:hidden text-primary" />
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
              {isNavigating && (
                  <motion.div
                      key="loader"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50"
                  >
                      <Loader className="h-10 w-10 animate-spin text-primary" />
                  </motion.div>
              )}
          </AnimatePresence>
          {!isNavigating && children}
        </main>
      </SidebarInset>
    </>
  );
}
