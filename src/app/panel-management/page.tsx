"use client";

import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset } from "@/components/ui/sidebar";
import { PanelManagementPage } from "@/components/contract-intelligence/panel-management-page";

export default function PanelManagementRoute() {
  return (
    <div className="flex h-screen w-full">
      <AppSidebar />
      <SidebarInset>
        <PanelManagementPage />
      </SidebarInset>
    </div>
  );
}
