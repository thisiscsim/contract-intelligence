"use client";

import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset } from "@/components/ui/sidebar";
import { DeflectionWorkflowPage } from "@/components/contract-intelligence/deflection-workflow-page";

export default function DeflectionWorkflowRoute() {
  return (
    <div className="flex h-screen w-full">
      <AppSidebar />
      <SidebarInset>
        <DeflectionWorkflowPage />
      </SidebarInset>
    </div>
  );
}
