"use client";

import { useEffect, useState } from "react";
import { checkBackendHealth, predictWaitingTime } from "../lib/api";

export default function Home() {
  const [backendStatus, setBackendStatus] = useState("Checking backend...");
  const [crop, setCrop] = useState("Wheat");
  const [quantity, setQuantity] = useState("50");
  const [prediction, setPrediction] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    checkBackendHealth()
      .then(() => setBackendStatus("Backend connected ✓"))
      .catch(() => setBackendStatus("Backend unavailable"));
  }, []);

  async function handlePrediction() {
    setLoading(true);
    setError("");
    setPrediction(null);

    try {
      const result = await predictWaitingTime({
        quantity_quintals: Number(quantity),
        queue_length: 25,
        active_counters: 2,
        avg_processing_time: 9,
        capacity_used_pct: 60,
        hour: 11,
        day_of_week: 2,
        centre_id: "C001",
        crop,
        weather: "Clear",
      });

      setPrediction(result.predicted_waiting_time_minutes);
    } catch {
      setError("Unable to get waiting-time prediction. Please try again.");
    } finally {
      setLoading(false);
    }
  }

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

        <div className="mt-8 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900">
            Tell us about your crop
          </h2>

          <div className="mt-5">
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Crop
            </label>

            <select
              value={crop}
              onChange={(e) => setCrop(e.target.value)}
              className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-slate-900 outline-none focus:border-slate-500"
            >
              <option>Wheat</option>
              <option>Soybean</option>
              <option>Rice</option>
              <option>Gram</option>
              <option>Maize</option>
            </select>
          </div>

          <div className="mt-5">
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Quantity (quintals)
            </label>

            <input
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="w-full rounded-xl border border-gray-300 px-4 py-3 text-slate-900 outline-none focus:border-slate-500"
              placeholder="Enter quantity"
            />
          </div>

          <button
            onClick={handlePrediction}
            disabled={loading || !quantity}
            className="mt-6 w-full rounded-xl bg-slate-900 px-6 py-3 font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Finding best time..." : "Find Best Centre"}
          </button>

          {error && (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
          )}

          {prediction !== null && (
            <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
              <p className="text-sm font-medium text-emerald-700">
                Recommended waiting time
              </p>

              <p className="mt-2 text-4xl font-bold text-slate-900">
                {prediction} min
              </p>

              <p className="mt-2 text-sm text-slate-600">
                Based on the current prototype prediction model.
              </p>
            </div>
          )}
        </div>

        <p className="mt-5 text-xs text-gray-500">
          Prototype note: operational centre conditions are currently
          represented using synthetic training conditions.
        </p>
      </div>
    </main>
  );
}
