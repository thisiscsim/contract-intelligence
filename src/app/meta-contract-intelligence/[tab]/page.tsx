"use client";

import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset } from "@/components/ui/sidebar";
import { MetaContractIntelligencePage } from "@/components/contract-intelligence/meta-contract-intelligence-page";

export default function MetaContractIntelligenceTabPage() {
  return (
    <div className="flex h-screen w-full">
      <AppSidebar />
      <SidebarInset>
        <MetaContractIntelligencePage />
      </SidebarInset>
    </div>
  );
}
