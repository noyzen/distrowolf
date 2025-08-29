
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
} from "@/components/ui/sidebar";
import {
  Boxes,
  Download,
  HardDrive,
  Wrench,
  PlusCircle,
  Search
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { useSearch } from "@/hooks/use-search";


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

  const currentPage = navItems.find((item) => {
    if (item.href === '/') return pathname === '/';
    return pathname.startsWith(item.href) && (pathname.length === item.href.length || pathname[item.href.length] === '/');
  }) ?? navItems.find(item => item.href === '/'); 

  const isSearchablePage = pathname === '/' || pathname === '/images';


  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/20 rounded-lg">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6 text-primary">
                   <path d="M14 6H8a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-6" />
                   <path d="m12 14-6-6" />
                   <path d="M18 12h-6" />
                </svg>
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
          <SidebarTrigger className="md:hidden" />
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
        <main className="flex-1 p-4 sm:p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
