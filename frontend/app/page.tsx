"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter();

  const [language, setLanguage] = useState<"EN" | "HI">("EN");
  const [mobile, setMobile] = useState("");

  const hindi = language === "HI";

  function continueAsFarmer() {
    router.push("/farmer");
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto flex min-h-screen max-w-5xl items-center justify-center px-5 py-8">
        <div className="w-full max-w-md">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                ProcureSmart
              </h1>

              <p className="mt-1 text-xs text-slate-500">
                Sahi Jankari, Sahi Samay
              </p>
            </div>

            <button
              onClick={() => setLanguage(hindi ? "EN" : "HI")}
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold shadow-sm"
            >
              {hindi ? "English" : "हिन्दी"}
            </button>
          </div>

          <section className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm sm:p-8">
            <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-2xl">
              🌾
            </div>

            <p className="text-sm font-semibold text-emerald-700">
              {hindi ? "किसान प्रवेश" : "Farmer Entry"}
            </p>

            <h2 className="mt-2 text-3xl font-bold tracking-tight">
              {hindi
                ? "सही खरीद केंद्र चुनें"
                : "Choose the right procurement centre"}
            </h2>

            <p className="mt-3 text-sm leading-6 text-slate-600">
              {hindi
                ? "अपनी फसल और मात्रा की जानकारी देकर बेहतर खरीद केंद्र और अनुमानित प्रतीक्षा समय जानें।"
                : "Enter your crop and quantity to find a better procurement centre and estimated waiting time."}
            </p>

            <label className="mt-7 block text-sm font-medium text-slate-700">
              {hindi ? "मोबाइल नंबर" : "Mobile Number"}
            </label>

            <input
              type="tel"
              inputMode="numeric"
              value={mobile}
              onChange={(e) =>
                setMobile(e.target.value.replace(/\D/g, "").slice(0, 10))
              }
              placeholder={
                hindi ? "10 अंकों का मोबाइल नंबर" : "10-digit mobile number"
              }
              className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3.5 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            />

            <button
              onClick={continueAsFarmer}
              className="mt-5 w-full rounded-2xl bg-emerald-600 px-5 py-4 text-sm font-bold text-white transition hover:bg-emerald-700"
            >
              {hindi ? "किसान के रूप में जारी रखें" : "Continue as Farmer"} →
            </button>

            <button
              onClick={continueAsFarmer}
              className="mt-3 w-full rounded-2xl border border-slate-300 bg-white px-5 py-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              {hindi
                ? "अतिथि के रूप में जारी रखें — प्रोटोटाइप"
                : "Continue as Guest — Prototype"}
            </button>

            <div className="my-6 flex items-center gap-3">
              <div className="h-px flex-1 bg-slate-200" />
              <span className="text-xs text-slate-400">OR</span>
              <div className="h-px flex-1 bg-slate-200" />
            </div>

            <button
              onClick={() =>
                alert(
                  hindi
                    ? "Operator Dashboard अगले चरण में जोड़ा जाएगा।"
                    : "Operator Dashboard will be added in a later phase."
                )
              }
              className="w-full rounded-2xl border border-slate-200 px-5 py-3 text-sm font-medium text-slate-500 hover:bg-slate-50"
            >
              {hindi ? "Operator / Centre Login" : "Operator / Centre Login"}
            </button>
          </section>

          <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs leading-5 text-amber-800">
            {hindi
              ? "प्रोटोटाइप मोड: operational conditions और predictions synthetic data पर आधारित हैं।"
              : "Prototype mode: operational conditions and predictions currently use synthetic data."}
          </div>

          <p className="mt-6 text-center text-xs text-slate-400">
            ProcureSmart · Sahi Jankari, Sahi Samay
          </p>
        </div>
      </div>
    </main>
  );
}
