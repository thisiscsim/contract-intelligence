"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function MetaContractIntelligenceIndex() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/meta-contract-intelligence/trends");
  }, [router]);
  return null;
}
