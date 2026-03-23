"use client";

import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset } from "@/components/ui/sidebar";
import { ContractIntelligencePage } from "@/components/contract-intelligence/contract-intelligence-page";

export default function ContractIntelligenceTabPage() {
  return (
    <div className="flex h-screen w-full">
      <AppSidebar />
      <SidebarInset>
        <ContractIntelligencePage />
      </SidebarInset>
    </div>
  );
}
