"use client";

import { useEffect, useState } from "react";
import { checkBackendHealth } from "../lib/api";

export default function Home() {
  const [backendStatus, setBackendStatus] = useState("Checking backend...");

  useEffect(() => {
    checkBackendHealth()
      .then(() => setBackendStatus("Backend connected ✓"))
      .catch(() => setBackendStatus("Backend unavailable"));
  }, []);

  return (
    <main className="min-h-screen bg-gray-50 px-6 py-12">
      <div className="mx-auto max-w-3xl">
        <p className="mb-3 text-sm font-medium text-amber-700">
          ProcureSmart
        </p>

        <h1 className="text-4xl font-bold text-slate-900">
          Sahi Jankari, Sahi Samay
        </h1>

        <p className="mt-4 text-lg text-gray-600">
          Know where to go and when to go for crop procurement.
        </p>

        <div className="mt-6 rounded-xl border border-gray-200 bg-white p-4 text-sm text-gray-700">
          {backendStatus}
        </div>

        <button className="mt-8 rounded-xl bg-slate-900 px-6 py-3 font-medium text-white">
          Find Best Centre
        </button>
      </div>
    </main>
  );
}
