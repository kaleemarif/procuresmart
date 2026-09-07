"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { recommendCentres } from "@/lib/api";

const ProcurementMap = dynamic(
  () => import("@/components/farmer/ProcurementMap"),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[360px] items-center justify-center rounded-[26px] border border-[#d8d2c5] bg-[#e9e5da] text-sm text-[#667169]">
        Loading map...
      </div>
    ),
  }
);
