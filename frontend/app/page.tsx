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
    <main className="min-h-screen bg-[#f7f8f3] text-slate-900">
      <div className="mx-auto flex min-h-screen max-w-5xl items-center justify-center px-5 py-8">
        <div className="w-full max-w-md">

          {/* Header */}
          <div className="mb-7 flex items-center justify-between">
            <div>
              <p className="text-sm font-black tracking-tight text-emerald-700">
                ProcureSmart
              </p>

              <p className="mt-1 text-xs text-slate-500">
                Sahi Jankari, Sahi Samay
              </p>
            </div>

            <button
              onClick={() => setLanguage(hindi ? "EN" : "HI")}
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-bold shadow-sm"
            >
              {hindi ? "English" : "हिन्दी"}
            </button>
          </div>

          {/* F-01 Entry */}
          <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-xl">

            {/* Agriculture visual */}
            <div className="relative flex h-64 items-center justify-center overflow-hidden bg-gradient-to-br from-emerald-100 via-lime-50 to-orange-50">
              <div className="absolute -left-12 -top-12 h-40 w-40 rounded-full bg-emerald-200/50 blur-2xl" />
              <div className="absolute -bottom-10 -right-10 h-44 w-44 rounded-full bg-orange-200/40 blur-2xl" />

              <div className="relative text-center">
                <div className="text-8xl">👨‍🌾</div>
                <div className="-mt-2 text-5xl">🌾</div>
              </div>

              <div className="absolute bottom-4 left-4 rounded-full border border-white/70 bg-white/80 px-3 py-1.5 text-[10px] font-bold text-emerald-800 backdrop-blur">
                FARMER-FIRST PLATFORM
              </div>
            </div>

            {/* Content */}
            <div className="p-7 sm:p-8">

              <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700">
                {hindi ? "किसान प्रवेश" : "Farmer Entry"}
              </p>

              <h1 className="mt-3 text-3xl font-black leading-tight tracking-tight">
                {hindi
                  ? "सही खरीद केंद्र और सही समय चुनें।"
                  : "Choose the right procurement centre and the right time."}
              </h1>

              <p className="mt-4 text-sm leading-6 text-slate-500">
                {hindi
                  ? "अपनी फसल और मात्रा की जानकारी देकर बेहतर खरीद केंद्र और अनुमानित प्रतीक्षा समय जानें।"
                  : "Get an intelligent recommendation based on waiting time, distance, queue and centre capacity."}
              </p>

              {/* Login */}
              <div className="mt-7">
                <label className="text-sm font-bold text-slate-700">
                  {hindi ? "मोबाइल नंबर" : "Mobile Number"}
                </label>

                <div className="mt-2 flex overflow-hidden rounded-2xl border border-slate-300 bg-white focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-100">
                  <span className="flex items-center border-r border-slate-200 px-4 text-sm font-bold text-slate-500">
                    +91
                  </span>

                  <input
                    type="tel"
                    inputMode="numeric"
                    value={mobile}
                    onChange={(e) =>
                      setMobile(
                        e.target.value.replace(/\D/g, "").slice(0, 10)
                      )
                    }
                    placeholder={
                      hindi
                        ? "10 अंकों का मोबाइल नंबर"
                        : "10-digit mobile number"
                    }
                    className="min-w-0 flex-1 px-4 py-4 text-sm outline-none"
                  />
                </div>

                <button
                  onClick={continueAsFarmer}
                  className="mt-4 w-full rounded-2xl bg-emerald-700 px-5 py-4 text-sm font-black text-white shadow-lg shadow-emerald-700/20 transition hover:bg-emerald-800"
                >
                  {hindi ? "किसान के रूप में जारी रखें" : "Continue as Farmer"} →
                </button>
              </div>

              {/* Guest */}
              <button
                onClick={continueAsFarmer}
                className="mt-3 w-full rounded-2xl border border-slate-300 bg-white px-5 py-4 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
              >
                {hindi
                  ? "अतिथि के रूप में जारी रखें — Prototype"
                  : "Continue as Guest — Prototype"}
              </button>

              {/* Divider */}
              <div className="my-6 flex items-center gap-3">
                <div className="h-px flex-1 bg-slate-200" />
                <span className="text-[10px] font-bold text-slate-400">
                  OR
                </span>
                <div className="h-px flex-1 bg-slate-200" />
              </div>

              {/* Operator */}
              <button
                onClick={() =>
                  alert(
                    hindi
                      ? "Operator Dashboard अगले चरण में जोड़ा जाएगा।"
                      : "Operator Dashboard will be added in a later phase."
                  )
                }
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-3.5 text-sm font-bold text-slate-500 transition hover:bg-slate-100"
              >
                Operator / Centre Login
              </button>
            </div>
          </section>

          {/* Prototype disclosure */}
          <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4">
            <p className="text-[10px] font-black uppercase tracking-wider text-amber-700">
              Prototype Disclosure
            </p>

            <p className="mt-1 text-xs leading-5 text-amber-800">
              {hindi
                ? "Operational conditions और predictions अभी synthetic data पर आधारित हैं।"
                : "Operational conditions and predictions currently use synthetic data."}
            </p>
          </div>

          <p className="mt-6 text-center text-[11px] text-slate-400">
            ProcureSmart · Sahi Jankari, Sahi Samay
          </p>
        </div>
      </div>
    </main>
  );
                }
