"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function Home() {
  const router = useRouter();
  const [role, setRole] = useState<"farmer" | "operator">("farmer");
  const [language, setLanguage] = useState<"en" | "hi">("en");

  function continueToApp() {
    if (role === "farmer") {
      router.push("/farmer");
    } else {
      alert("Operator Dashboard will be available in a later phase.");
    }
  }

  const hindi = language === "hi";

  return (
    <main className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-emerald-50 px-5 py-6">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-md flex-col justify-between">

        <div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold tracking-wide text-emerald-700">
                ProcureSmart
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Sahi Jankari, Sahi Samay
              </p>
            </div>

            <div className="flex rounded-full border border-slate-200 bg-white p-1 shadow-sm">
              <button
                onClick={() => setLanguage("en")}
                className={`rounded-full px-3 py-1 text-xs font-medium ${
                  language === "en"
                    ? "bg-slate-900 text-white"
                    : "text-slate-600"
                }`}
              >
                EN
              </button>

              <button
                onClick={() => setLanguage("hi")}
                className={`rounded-full px-3 py-1 text-xs font-medium ${
                  language === "hi"
                    ? "bg-slate-900 text-white"
                    : "text-slate-600"
                }`}
              >
                हिंदी
              </button>
            </div>
          </div>

          <div className="mt-14 text-center">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-emerald-100 text-4xl shadow-sm">
              🌾
            </div>

            <h1 className="mt-6 text-4xl font-bold tracking-tight text-slate-900">
              ProcureSmart
            </h1>

            <p className="mt-3 text-lg font-medium text-emerald-700">
              {hindi ? "सही जानकारी, सही समय" : "Sahi Jankari, Sahi Samay"}
            </p>

            <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-slate-600">
              {hindi
                ? "फसल खरीद के लिए सही केंद्र चुनें और बेहतर समय पर जाएँ।"
                : "Find the right procurement centre and know when to go."}
            </p>
          </div>

          <div className="mt-10 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setRole("farmer")}
                className={`rounded-xl px-4 py-3 text-sm font-semibold transition ${
                  role === "farmer"
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "text-slate-600"
                }`}
              >
                🌾 {hindi ? "किसान" : "Farmer"}
              </button>

              <button
                onClick={() => setRole("operator")}
                className={`rounded-xl px-4 py-3 text-sm font-semibold transition ${
                  role === "operator"
                    ? "bg-slate-900 text-white shadow-sm"
                    : "text-slate-600"
                }`}
              >
                🧑‍💼 {hindi ? "ऑपरेटर" : "Operator"}
              </button>
            </div>
          </div>

          <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold text-slate-900">
              {role === "farmer"
                ? hindi
                  ? "किसान प्रवेश"
                  : "Farmer Entry"
                : hindi
                ? "ऑपरेटर प्रवेश"
                : "Operator Entry"}
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              {role === "farmer"
                ? hindi
                  ? "अपनी फसल की खरीद के लिए सही केंद्र खोजें।"
                  : "Find the best procurement centre for your crop."
                : hindi
                ? "केंद्र की गतिविधियों और संचालन को प्रबंधित करें।"
                : "Manage procurement-centre operations and activities."}
            </p>

            {role === "farmer" && (
              <div className="mt-5 space-y-3">
                <input
                  type="tel"
                  placeholder={hindi ? "मोबाइल नंबर" : "Mobile number"}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none focus:border-emerald-500"
                />

                <button
                  onClick={continueToApp}
                  className="w-full rounded-xl bg-emerald-600 px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-emerald-700"
                >
                  {hindi ? "जारी रखें" : "Continue as Farmer"} →
                </button>

                <button
                  onClick={continueToApp}
                  className="w-full rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  {hindi
                    ? "प्रोटोटाइप के रूप में जारी रखें"
                    : "Continue as Guest — Prototype"}
                </button>
              </div>
            )}

            {role === "operator" && (
              <button
                onClick={continueToApp}
                className="mt-5 w-full rounded-xl bg-slate-900 px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                {hindi ? "ऑपरेटर के रूप में जारी रखें" : "Continue as Operator"} →
              </button>
            )}
          </div>
        </div>

        <div className="mt-8 text-center">
          <p className="text-xs text-slate-400">
            Smart India Hackathon 2026 • ProcureSmart Prototype
          </p>
        </div>
      </div>
    </main>
  );
}
