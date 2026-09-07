"use client";

import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#f5f2ea] text-[#26362e]">
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col px-5 py-8 lg:px-8">
        {/* Header */}
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#244b3a] text-xl font-bold text-white">
              P
            </div>

            <div>
              <p className="text-lg font-bold tracking-tight">
                ProcureSmart
              </p>
              <p className="text-xs text-[#78817a]">
                Intelligent Procurement Guidance
              </p>
            </div>
          </div>

          <span className="hidden rounded-full border border-[#d9d4c8] bg-white px-3 py-1.5 text-xs font-semibold text-[#69736c] sm:block">
            SIH 2026 Prototype
          </span>
        </header>

        {/* Main */}
        <section className="flex flex-1 items-center justify-center py-12">
          <div className="w-full max-w-4xl">
            <div className="mb-10 text-center">
              <p className="mb-3 text-xs font-bold uppercase tracking-[0.22em] text-[#708077]">
                Welcome to ProcureSmart
              </p>

              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
                How would you like to continue?
              </h1>

              <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-[#68736b] sm:text-lg">
                Choose your role to access the right ProcureSmart experience.
              </p>
            </div>

            {/* Role cards */}
            <div className="grid gap-5 md:grid-cols-2">
              {/* Farmer */}
              <Link
                href="/farmer"
                className="group rounded-3xl border border-[#d9d4c8] bg-white p-7 shadow-[0_10px_35px_rgba(48,59,52,0.06)] transition duration-200 hover:-translate-y-1 hover:border-[#aebfb3] hover:shadow-[0_16px_45px_rgba(48,59,52,0.10)] sm:p-8"
              >
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#e7efe9] text-3xl">
                  🌾
                </div>

                <p className="mt-6 text-xs font-bold uppercase tracking-[0.18em] text-[#718078]">
                  For Farmers
                </p>

                <h2 className="mt-2 text-2xl font-bold text-[#26362e]">
                  Farmer
                </h2>

                <p className="mt-3 text-sm leading-6 text-[#69736c]">
                  Get intelligent guidance on which procurement centre to visit
                  based on waiting time, queue, capacity and distance.
                </p>

                <div className="mt-7 flex items-center justify-between">
                  <span className="text-sm font-bold text-[#315542]">
                    Continue as Farmer
                  </span>

                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#244b3a] text-lg text-white transition-transform group-hover:translate-x-1">
                    →
                  </span>
                </div>
              </Link>

              {/* Operator */}
              <Link
                href="/operator/login"
                className="group rounded-3xl border border-[#d9d4c8] bg-white p-7 shadow-[0_10px_35px_rgba(48,59,52,0.06)] transition duration-200 hover:-translate-y-1 hover:border-[#aebfb3] hover:shadow-[0_16px_45px_rgba(48,59,52,0.10)] sm:p-8"
              >
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#eeeae1] text-3xl">
                  🏢
                </div>

                <p className="mt-6 text-xs font-bold uppercase tracking-[0.18em] text-[#718078]">
                  For Operations
                </p>

                <h2 className="mt-2 text-2xl font-bold text-[#26362e]">
                  Operator
                </h2>

                <p className="mt-3 text-sm leading-6 text-[#69736c]">
                  Monitor procurement centres, manage queues, counters,
                  capacity and operational status in real time.
                </p>

                <div className="mt-7 flex items-center justify-between">
                  <span className="text-sm font-bold text-[#315542]">
                    Operator Login
                  </span>

                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#244b3a] text-lg text-white transition-transform group-hover:translate-x-1">
                    →
                  </span>
                </div>
              </Link>
            </div>

            {/* Prototype note */}
            <div className="mx-auto mt-8 max-w-2xl rounded-2xl border border-[#e0d5b6] bg-[#fffaf0] px-5 py-4 text-center">
              <p className="text-xs leading-5 text-[#766b4d]">
                Prototype environment • Centre data is synthetic for the SIH
                demonstration.
              </p>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="pt-6 text-center text-xs text-[#8a918b]">
          ProcureSmart • Smart India Hackathon 2026
        </footer>
      </div>
    </main>
  );
}
