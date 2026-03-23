"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ContractIntelligenceIndex() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/contract-intelligence/overview");
  }, [router]);
  return null;
}
