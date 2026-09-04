"use client";

import { useEffect, useState } from "react";
import { checkBackendHealth, recommendCentres } from "../lib/api";

type Centre = {
  centre_id: string;
  centre_name: string;
  distance_km: number;
  queue_length: number;
  active_counters: number;
  avg_processing_time: number;
  capacity_used_pct: number;
  predicted_waiting_time_minutes: number;
  score: number;
  rank: number;
  reason: string;
};

type RecommendationResult = {
  recommended_centre: Centre;
  alternatives: Centre[];
  weights: {
    waiting_time: number;
    distance: number;
    queue: number;
    capacity: number;
  };
  data_mode: string;
};

export default function Home() {
  const [backendStatus, setBackendStatus] = useState("Checking backend...");
  const [crop, setCrop] = useState("Wheat");
  const [quantity, setQuantity] = useState("50");
  const [recommendation, setRecommendation] =
    useState<RecommendationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    checkBackendHealth()
      .then(() => setBackendStatus("Backend connected ✓"))
      .catch(() => setBackendStatus("Backend unavailable"));
  }, []);

  async function handleRecommendation() {
    const quantityValue = Number(quantity);

    if (!quantityValue || quantityValue <= 0) {
      setError("Please enter a valid quantity.");
      return;
    }

    setLoading(true);
    setError("");
    setRecommendation(null);

    try {
      const result = await recommendCentres({
        crop,
        quantity_quintals: quantityValue,
        hour: 11,
        day_of_week: 2,
        weather: "Clear",
      });

      setRecommendation(result);
    } catch {
      setError("Unable to find the best centre. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const centre = recommendation?.recommended_centre;

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
            onClick={handleRecommendation}
            disabled={loading || !quantity}
            className="mt-6 w-full rounded-xl bg-slate-900 px-6 py-3 font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Finding best centre..." : "Find Best Centre"}
          </button>

          {error && (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
          )}

          {centre && (
            <div className="mt-6">
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-emerald-700">
                      Recommended Centre
                    </p>

                    <h3 className="mt-1 text-2xl font-bold text-slate-900">
                      {centre.centre_name}
                    </h3>

                    <p className="mt-1 text-sm text-slate-600">
                      {centre.centre_id}
                    </p>
                  </div>

                  <div className="rounded-full bg-emerald-600 px-3 py-1 text-xs font-semibold text-white">
                    #{centre.rank}
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <div className="rounded-xl bg-white p-3">
                    <p className="text-xs text-gray-500">Est. Wait</p>
                    <p className="mt-1 text-lg font-bold text-slate-900">
                      {centre.predicted_waiting_time_minutes} min
                    </p>
                  </div>

                  <div className="rounded-xl bg-white p-3">
                    <p className="text-xs text-gray-500">Distance</p>
                    <p className="mt-1 text-lg font-bold text-slate-900">
                      {centre.distance_km} km
                    </p>
                  </div>

                  <div className="rounded-xl bg-white p-3">
                    <p className="text-xs text-gray-500">Queue</p>
                    <p className="mt-1 text-lg font-bold text-slate-900">
                      {centre.queue_length}
                    </p>
                  </div>

                  <div className="rounded-xl bg-white p-3">
                    <p className="text-xs text-gray-500">Score</p>
                    <p className="mt-1 text-lg font-bold text-slate-900">
                      {centre.score}
                    </p>
                  </div>
                </div>

                <div className="mt-4 rounded-xl bg-white p-4">
                  <p className="text-sm font-semibold text-slate-900">
                    Why this centre?
                  </p>

                  <p className="mt-1 text-sm text-slate-600">
                    {centre.reason}
                  </p>
                </div>
              </div>

              {recommendation.alternatives.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold text-slate-900">
                    Other Nearby Options
                  </h3>

                  <div className="mt-3 space-y-3">
                    {recommendation.alternatives.slice(0, 3).map((item) => (
                      <div
                        key={item.centre_id}
                        className="rounded-xl border border-gray-200 bg-white p-4"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="font-semibold text-slate-900">
                              {item.centre_name}
                            </p>

                            <p className="mt-1 text-sm text-slate-500">
                              {item.predicted_waiting_time_minutes} min wait
                              {" • "}
                              {item.distance_km} km
                            </p>
                          </div>

                          <span className="text-sm font-semibold text-slate-500">
                            #{item.rank}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-800">
                Prototype note: centre operational conditions and predictions
                currently use synthetic prototype data.
              </div>
            </div>
          )}
        </div>

        <p className="mt-5 text-xs text-gray-500">
          Recommendation uses an explainable scoring model based on waiting
          time, distance, queue and capacity.
        </p>
      </div>
    </main>
  );
}
