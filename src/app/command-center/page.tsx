"use client";

import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset } from "@/components/ui/sidebar";
import { PrototypeCommandCenter } from "@/components/contract-intelligence/prototype-command-center";

export default function CommandCenterPage() {
  return (
    <div className="flex h-screen w-full">
      <AppSidebar />
      <SidebarInset>
        <PrototypeCommandCenter />
      </SidebarInset>
    </div>
  );
}
