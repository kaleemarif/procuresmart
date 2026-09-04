"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { recommendCentres } from "../lib/api";

export default function FarmerPage() {
  const router = useRouter();

  const [screen, setScreen] = useState("dashboard");
  const [language, setLanguage] = useState<"EN" | "HI">("EN");
  const [location, setLocation] = useState("");
  const [crop, setCrop] = useState("");
  const [quantity, setQuantity] = useState("");
  const [recommendation, setRecommendation] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const crops = ["Wheat", "Soybean", "Rice", "Gram", "Maize"];

  async function getRecommendation() {
    if (!crop || !quantity) {
      setError("Please select crop and enter quantity.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const now = new Date();

      const result = await recommendCentres({
        crop,
        quantity_quintals: Number(quantity),
        hour: now.getHours(),
        day_of_week: now.getDay(),
        weather: "Clear",
      });

      setRecommendation(result);
      setScreen("recommendation");
    } catch (err) {
      setError("Unable to get recommendation. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (screen === "dashboard") {
    return (
      <main className="min-h-screen bg-slate-50 text-slate-900">
        <div className="mx-auto max-w-5xl px-5 py-6">
          <header className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-emerald-600">
                ProcureSmart
              </p>
              <h1 className="mt-1 text-2xl font-bold">
                {language === "EN"
                  ? "Good morning, Farmer 👋"
                  : "नमस्ते किसान 👋"}
              </h1>
            </div>

            <button
              onClick={() => setLanguage(language === "EN" ? "HI" : "EN")}
              className="rounded-full border bg-white px-4 py-2 text-sm font-semibold"
            >
              {language === "EN" ? "हिंदी" : "EN"}
            </button>
          </header>

          <section className="mt-8 rounded-3xl bg-emerald-600 p-7 text-white shadow-lg">
            <p className="text-sm opacity-90">ProcureSmart</p>

            <h2 className="mt-2 text-3xl font-bold">
              {language === "EN"
                ? "Choose the right centre and the right time."
                : "सही केंद्र और सही समय चुनें।"}
            </h2>

            <p className="mt-3 max-w-xl text-sm leading-6 opacity-90">
              Get an intelligent recommendation based on waiting time,
              distance, queue and centre capacity.
            </p>

            <button
              onClick={() => setScreen("location")}
              className="mt-6 rounded-2xl bg-white px-5 py-3 font-bold text-emerald-700"
            >
              Find Best Procurement Centre →
            </button>
          </section>

          <section className="mt-6 grid gap-5 md:grid-cols-2">
            <div className="rounded-3xl border bg-white p-6">
              <p className="text-sm font-semibold text-slate-500">
                Today's Market Prices
              </p>
              <h3 className="mt-3 text-xl font-bold">
                Data integration is pending
              </h3>
              <p className="mt-2 text-sm text-slate-500">
                Live price data will be connected in a future version.
              </p>
            </div>

            <div className="rounded-3xl border bg-white p-6">
              <p className="text-sm font-semibold text-slate-500">
                My Activity
              </p>
              <h3 className="mt-3 text-xl font-bold">
                No activity yet
              </h3>
              <p className="mt-2 text-sm text-slate-500">
                Your procurement activity will appear here.
              </p>
            </div>
          </section>
        </div>
      </main>
    );
  }

  if (screen === "location") {
    return (
      <main className="min-h-screen bg-slate-50 px-5 py-8">
        <div className="mx-auto max-w-xl">
          <button
            onClick={() => setScreen("dashboard")}
            className="text-sm font-semibold text-slate-500"
          >
            ← Back
          </button>

          <h1 className="mt-8 text-3xl font-bold">
            Where are you located?
          </h1>

          <p className="mt-2 text-slate-500">
            This helps us compare nearby procurement centres.
          </p>

          <button
            onClick={() => {
              if (!navigator.geolocation) {
                setError("Location is not supported by this browser.");
                return;
              }

              navigator.geolocation.getCurrentPosition(
                (position) => {
                  setLocation(
                    `${position.coords.latitude.toFixed(
                      4
                    )}, ${position.coords.longitude.toFixed(4)}`
                  );
                  setScreen("crop");
                },
                () => {
                  setError(
                    "Unable to access location. You can continue manually."
                  );
                }
              );
            }}
            className="mt-8 w-full rounded-2xl bg-emerald-600 px-5 py-4 font-bold text-white"
          >
            📍 Use My Current Location
          </button>

          <input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Or enter village / town / district"
            className="mt-4 w-full rounded-2xl border bg-white px-5 py-4 outline-none"
          />

          <button
            onClick={() => setScreen("crop")}
            className="mt-4 w-full rounded-2xl border bg-white px-5 py-4 font-bold"
          >
            Continue
          </button>

          {error && (
            <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-600">
              {error}
            </p>
          )}
        </div>
      </main>
    );
  }

  if (screen === "crop") {
    return (
      <main className="min-h-screen bg-slate-50 px-5 py-8">
        <div className="mx-auto max-w-xl">
          <button
            onClick={() => setScreen("location")}
            className="text-sm font-semibold text-slate-500"
          >
            ← Back
          </button>

          <h1 className="mt-8 text-3xl font-bold">
            Tell us about your produce
          </h1>

          <p className="mt-2 text-slate-500">
            Select your crop and approximate quantity.
          </p>

          <div className="mt-8 grid grid-cols-2 gap-3">
            {crops.map((item) => (
              <button
                key={item}
                onClick={() => setCrop(item)}
                className={`rounded-2xl border p-4 text-left font-semibold ${
                  crop === item
                    ? "border-emerald-600 bg-emerald-50 text-emerald-700"
                    : "bg-white"
                }`}
              >
                🌾 {item}
              </button>
            ))}
          </div>

          <label className="mt-7 block text-sm font-semibold">
            Quantity (quintals)
          </label>

          <input
            type="number"
            min="1"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            placeholder="Example: 50"
            className="mt-2 w-full rounded-2xl border bg-white px-5 py-4 outline-none"
          />

          <button
            onClick={getRecommendation}
            disabled={loading}
            className="mt-6 w-full rounded-2xl bg-emerald-600 px-5 py-4 font-bold text-white disabled:opacity-60"
          >
            {loading ? "Finding the best centre..." : "Done →"}
          </button>

          {error && (
            <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-600">
              {error}
            </p>
          )}
        </div>
      </main>
    );
  }

  if (screen === "recommendation") {
    const centre = recommendation?.recommended_centre;

    return (
      <main className="min-h-screen bg-slate-50 px-5 py-8">
        <div className="mx-auto max-w-2xl">
          <button
            onClick={() => setScreen("crop")}
            className="text-sm font-semibold text-slate-500"
          >
            ← Change details
          </button>

          <p className="mt-8 text-sm font-semibold text-emerald-600">
            RECOMMENDED FOR YOU
          </p>

          <h1 className="mt-2 text-3xl font-bold">
            Best Procurement Centre
          </h1>

          {centre && (
            <section className="mt-6 rounded-3xl border bg-white p-6 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm text-slate-500">
                    Rank #1
                  </p>

                  <h2 className="mt-1 text-2xl font-bold">
                    {centre.centre_name}
                  </h2>
                </div>

                <div className="rounded-2xl bg-emerald-50 px-4 py-3 text-center">
                  <p className="text-xs text-slate-500">Score</p>
                  <p className="text-xl font-bold text-emerald-700">
                    {centre.score}
                  </p>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs text-slate-500">Waiting</p>
                  <p className="mt-1 font-bold">
                    {centre.predicted_waiting_time_minutes} min
                  </p>
                </div>

                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs text-slate-500">Distance</p>
                  <p className="mt-1 font-bold">
                    {centre.distance_km} km
                  </p>
                </div>

                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs text-slate-500">Queue</p>
                  <p className="mt-1 font-bold">
                    {centre.queue_length}
                  </p>
                </div>

                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs text-slate-500">Capacity</p>
                  <p className="mt-1 font-bold">
                    {centre.capacity_used_pct}%
                  </p>
                </div>
              </div>

              <p className="mt-5 text-sm leading-6 text-slate-600">
                {centre.reason}
              </p>

              <button
                onClick={() => setScreen("details")}
                className="mt-6 w-full rounded-2xl bg-emerald-600 px-5 py-4 font-bold text-white"
              >
                View Centre Details →
              </button>
            </section>
          )}

          <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            Prototype mode: recommendations currently use synthetic training
            data and demo centre information.
          </div>
        </div>
      </main>
    );
  }

  if (screen === "details") {
    const centre = recommendation?.recommended_centre;

    return (
      <main className="min-h-screen bg-slate-50 px-5 py-8">
        <div className="mx-auto max-w-2xl">
          <button
            onClick={() => setScreen("recommendation")}
            className="text-sm font-semibold text-slate-500"
          >
            ← Back
          </button>

          <h1 className="mt-8 text-3xl font-bold">
            Centre Details
          </h1>

          {centre && (
            <section className="mt-6 rounded-3xl border bg-white p-6">
              <h2 className="text-2xl font-bold">
                {centre.centre_name}
              </h2>

              <div className="mt-5 rounded-2xl bg-slate-100 p-8 text-center">
                <p className="text-4xl">🗺️</p>
                <p className="mt-3 font-semibold">
                  Map integration coming next
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  Centre coordinates and live map will be connected in the
                  next phase.
                </p>
              </div>

              <div className="mt-5 grid gap-3 md:grid-cols-2">
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">Distance</p>
                  <p className="font-bold">{centre.distance_km} km</p>
                </div>

                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">Predicted Waiting</p>
                  <p className="font-bold">
                    {centre.predicted_waiting_time_minutes} minutes
                  </p>
                </div>
              </div>
            </section>
          )}

          <div className="mt-5 grid gap-3 md:grid-cols-2">
            <button
              onClick={() => setScreen("activity")}
              className="rounded-2xl border bg-white p-4 font-bold"
            >
              My Activity
            </button>

            <button
              onClick={() => setScreen("dashboard")}
              className="rounded-2xl bg-emerald-600 p-4 font-bold text-white"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </main>
    );
  }

  if (screen === "activity") {
    return (
      <main className="min-h-screen bg-slate-50 px-5 py-8">
        <div className="mx-auto max-w-xl">
          <button
            onClick={() => setScreen("details")}
            className="text-sm font-semibold text-slate-500"
          >
            ← Back
          </button>

          <h1 className="mt-8 text-3xl font-bold">
            My Activity
          </h1>

          <div className="mt-6 rounded-3xl border bg-white p-6 text-center">
            <p className="text-4xl">📋</p>
            <h2 className="mt-3 text-xl font-bold">
              No saved activity yet
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Activity history will be connected in a future phase.
            </p>
          </div>
        </div>
      </main>
    );
  }

  return null;
                       }
