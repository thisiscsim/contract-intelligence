"use client";

import { SidebarProvider } from "@/components/ui/sidebar";
import { HeroUIProvider } from "@heroui/react";
import { ThemeProvider } from "@/components/theme-provider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider defaultTheme="light" storageKey="harvey-theme">
      <HeroUIProvider>
        <SidebarProvider defaultOpen={true}>
          {children}
        </SidebarProvider>
      </HeroUIProvider>
    </ThemeProvider>
  );
}
