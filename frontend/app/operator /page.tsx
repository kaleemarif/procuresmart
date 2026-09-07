"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "https://procuresmart-cxx8.onrender.com";

type CentreStatus = "open" | "paused" | "closed";

type Centre = {
  centre_id: string;
  name: string;
  latitude: number;
  longitude: number;
  status: CentreStatus;
  active_counters: number;
  queue_length: number;
  capacity_used_pct: number;
  updated_at?: string;
};

const STATUS_OPTIONS: CentreStatus[] = ["open", "paused", "closed"];

function statusLabel(status: CentreStatus) {
  if (status === "open") return "Open";
  if (status === "paused") return "Paused";
  return "Closed";
}

function statusClasses(status: CentreStatus) {
  if (status === "open") {
    return "border-[#b9d8c2] bg-[#eef8f0] text-[#2f6840]";
  }

  if (status === "paused") {
    return "border-[#e5d5a8] bg-[#fff8df] text-[#80651f]";
  }

  return "border-[#e3c2c2] bg-[#fff0f0] text-[#8a3f3f]";
}

export default function OperatorDashboard() {
  const router = useRouter();

  const [centres, setCentres] = useState<Centre[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [updatingCentre, setUpdatingCentre] = useState<string | null>(null);

  const [drafts, setDrafts] = useState<
    Record<
      string,
      {
        status: CentreStatus;
        active_counters: string;
        queue_length: string;
        capacity_used_pct: string;
      }
    >
  >({});

  const operatorId =
    typeof window !== "undefined"
      ? sessionStorage.getItem("procuresmart_operator_id") || "operator"
      : "operator";

  const loadCentres = useCallback(async () => {
    try {
      setError("");

      const response = await fetch(`${API_BASE_URL}/operator/centres`, {
        method: "GET",
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }

      const data = await response.json();

      const loadedCentres: Centre[] = Array.isArray(data)
        ? data
        : Array.isArray(data?.centres)
          ? data.centres
          : [];

      setCentres(loadedCentres);

      const nextDrafts: Record<
        string,
        {
          status: CentreStatus;
          active_counters: string;
          queue_length: string;
          capacity_used_pct: string;
        }
      > = {};

      loadedCentres.forEach((centre) => {
        nextDrafts[centre.centre_id] = {
          status: centre.status,
          active_counters: String(centre.active_counters ?? 0),
          queue_length: String(centre.queue_length ?? 0),
          capacity_used_pct: String(centre.capacity_used_pct ?? 0),
        };
      });

      setDrafts(nextDrafts);
    } catch (err) {
      console.error(err);
      setError(
        "Unable to load procurement centre data. Please check the backend connection."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const authenticated =
      sessionStorage.getItem("procuresmart_operator_authenticated") === "true";

    if (!authenticated) {
      router.replace("/operator/login");
      return;
    }

    loadCentres();
  }, [router, loadCentres]);

  function updateDraft(
    centreId: string,
    field:
      | "status"
      | "active_counters"
      | "queue_length"
      | "capacity_used_pct",
    value: string
  ) {
    setDrafts((current) => ({
      ...current,
      [centreId]: {
        ...current[centreId],
        [field]: value as never,
      },
    }));
  }

  async function saveCentre(centre: Centre) {
    const draft = drafts[centre.centre_id];

    if (!draft) return;

    const activeCounters = Number(draft.active_counters);
    const queueLength = Number(draft.queue_length);
    const capacityUsed = Number(draft.capacity_used_pct);

    if (
      !Number.isFinite(activeCounters) ||
      !Number.isFinite(queueLength) ||
      !Number.isFinite(capacityUsed)
    ) {
      setError("Please enter valid numeric values.");
      return;
    }

    if (activeCounters < 0 || queueLength < 0) {
      setError("Queue and active counters cannot be negative.");
      return;
    }

    if (capacityUsed < 0 || capacityUsed > 100) {
      setError("Capacity must be between 0 and 100.");
      return;
    }

    try {
      setError("");
      setUpdatingCentre(centre.centre_id);

      const response = await fetch(
        `${API_BASE_URL}/operator/centre-state/${centre.centre_id}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status: draft.status,
            active_counters: activeCounters,
            queue_length: queueLength,
            capacity_used_pct: capacityUsed,
          }),
        }
      );

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || `Update failed with status ${response.status}`);
      }

      await loadCentres();
    } catch (err) {
      console.error(err);
      setError(
        "Could not update this centre. Please check the backend connection."
      );
    } finally {
      setUpdatingCentre(null);
    }
  }

  function handleRefresh() {
    setRefreshing(true);
    loadCentres();
  }

  function handleLogout() {
    sessionStorage.removeItem("procuresmart_operator_authenticated");
    sessionStorage.removeItem("procuresmart_operator_id");
    router.replace("/operator/login");
  }

  const openCount = centres.filter((c) => c.status === "open").length;
  const pausedCount = centres.filter((c) => c.status === "paused").length;
  const closedCount = centres.filter((c) => c.status === "closed").length;

  const totalQueue = centres.reduce(
    (total, centre) => total + (centre.queue_length || 0),
    0
  );

  const totalCounters = centres.reduce(
    (total, centre) => total + (centre.active_counters || 0),
    0
  );

  return (
    <main className="min-h-screen bg-[#f5f2ea] text-[#26362e]">
      <div className="mx-auto min-h-screen max-w-7xl px-5 py-6 lg:px-8">
        {/* Header */}
        <header className="flex flex-col gap-5 border-b border-[#ddd8cc] pb-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#244b3a] text-xl font-bold text-white">
              P
            </div>

            <div>
              <p className="text-lg font-bold tracking-tight">ProcureSmart</p>
              <p className="text-xs text-[#78817a]">
                Operator Control Centre
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-xs text-[#7a837d]">Signed in as</p>
              <p className="text-sm font-semibold">{operatorId}</p>
            </div>

            <button
              onClick={handleLogout}
              className="rounded-xl border border-[#d6d1c5] bg-white px-4 py-2.5 text-sm font-semibold text-[#566159] transition hover:bg-[#faf8f3]"
            >
              Logout
            </button>
          </div>
        </header>

        {/* Page heading */}
        <section className="pt-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="mb-3 inline-flex items-center rounded-full border border-[#d8d2c5] bg-white px-3 py-1.5 text-xs font-semibold text-[#6b746e]">
                Operator Dashboard
              </div>

              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Procurement Centre Control
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-[#6d766f] sm:text-base">
                Monitor centre conditions and update live operational state.
                Changes affect the farmer recommendation engine.
              </p>
            </div>

            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#244b3a] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#1d3f30] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <span
                className={refreshing ? "animate-spin" : ""}
                aria-hidden="true"
              >
                ↻
              </span>
              {refreshing ? "Refreshing..." : "Refresh Live Data"}
            </button>
          </div>
        </section>

        {/* Demo notice */}
        <div className="mt-6 rounded-2xl border border-[#e0d5b6] bg-[#fffaf0] px-5 py-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-bold text-[#675b3d]">
                Prototype / Demo Mode
              </p>
              <p className="mt-1 text-xs leading-5 text-[#7a7057]">
                Centre state is currently maintained by the ProcureSmart
                prototype backend. Production deployment should persist these
                states in Supabase.
              </p>
            </div>

            <span className="w-fit rounded-full border border-[#ded2ae] bg-white px-3 py-1.5 text-xs font-semibold text-[#796d4b]">
              SIH 2026
            </span>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mt-5 rounded-2xl border border-[#e2c3c3] bg-[#fff1f1] px-5 py-4 text-sm font-medium text-[#8a4141]">
            {error}
          </div>
        )}

        {/* Summary cards */}
        <section className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <div className="rounded-2xl border border-[#ddd8cc] bg-white p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#8a928c]">
              Total Centres
            </p>
            <p className="mt-2 text-3xl font-bold">{centres.length}</p>
          </div>

          <div className="rounded-2xl border border-[#b9d8c2] bg-[#eef8f0] p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#5d7d65]">
              Open
            </p>
            <p className="mt-2 text-3xl font-bold text-[#2f6840]">
              {openCount}
            </p>
          </div>

          <div className="rounded-2xl border border-[#e5d5a8] bg-[#fff8df] p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#806f3c]">
              Paused
            </p>
            <p className="mt-2 text-3xl font-bold text-[#80651f]">
              {pausedCount}
            </p>
          </div>

          <div className="rounded-2xl border border-[#e3c2c2] bg-[#fff0f0] p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#8a5c5c]">
              Closed
            </p>
            <p className="mt-2 text-3xl font-bold text-[#8a3f3f]">
              {closedCount}
            </p>
          </div>

          <div className="rounded-2xl border border-[#ddd8cc] bg-white p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#8a928c]">
              Total Queue
            </p>
            <p className="mt-2 text-3xl font-bold">{totalQueue}</p>
            <p className="mt-1 text-xs text-[#8a928c]">
              {totalCounters} active counters
            </p>
          </div>
        </section>

        {/* Centres */}
        <section className="mt-8">
          <div className="mb-4 flex items-end justify-between">
            <div>
              <h2 className="text-xl font-bold">Procurement Centres</h2>
              <p className="mt-1 text-sm text-[#7a837d]">
                Update operational values and save each centre.
              </p>
            </div>
          </div>

          {loading ? (
            <div className="rounded-2xl border border-[#ddd8cc] bg-white px-6 py-16 text-center">
              <div className="mx-auto h-9 w-9 animate-spin rounded-full border-4 border-[#d8d2c5] border-t-[#244b3a]" />
              <p className="mt-4 text-sm font-semibold text-[#68736b]">
                Loading procurement centres...
              </p>
            </div>
          ) : centres.length === 0 ? (
            <div className="rounded-2xl border border-[#ddd8cc] bg-white px-6 py-16 text-center">
              <p className="text-lg font-bold">No centres available</p>
              <p className="mt-2 text-sm text-[#7a837d]">
                The backend returned no procurement centre records.
              </p>
            </div>
          ) : (
            <div className="grid gap-5 lg:grid-cols-2">
              {centres.map((centre) => {
                const draft = drafts[centre.centre_id];
                const isUpdating = updatingCentre === centre.centre_id;

                return (
                  <article
                    key={centre.centre_id}
                    className="overflow-hidden rounded-2xl border border-[#ddd8cc] bg-white"
                  >
                    {/* Centre header */}
                    <div className="border-b border-[#ece8df] px-5 py-5">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="rounded-lg bg-[#f0eee8] px-2.5 py-1 text-xs font-bold text-[#68736b]">
                              {centre.centre_id}
                            </span>

                            <span
                              className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${statusClasses(
                                centre.status
                              )}`}
                            >
                              {statusLabel(centre.status)}
                            </span>
                          </div>

                          <h3 className="mt-3 text-lg font-bold">
                            {centre.name}
                          </h3>

                          <p className="mt-1 text-xs text-[#8a928c]">
                            Location: {centre.latitude.toFixed(4)},{" "}
                            {centre.longitude.toFixed(4)}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Current values */}
                    <div className="grid grid-cols-3 divide-x divide-[#ece8df] border-b border-[#ece8df]">
                      <div className="px-4 py-4 text-center">
                        <p className="text-xs text-[#8a928c]">Queue</p>
                        <p className="mt-1 text-xl font-bold">
                          {centre.queue_length}
                        </p>
                      </div>

                      <div className="px-4 py-4 text-center">
                        <p className="text-xs text-[#8a928c]">Counters</p>
                        <p className="mt-1 text-xl font-bold">
                          {centre.active_counters}
                        </p>
                      </div>

                      <div className="px-4 py-4 text-center">
                        <p className="text-xs text-[#8a928c]">Capacity</p>
                        <p className="mt-1 text-xl font-bold">
                          {centre.capacity_used_pct}%
                        </p>
                      </div>
                    </div>

                    {/* Controls */}
                    <div className="space-y-4 px-5 py-5">
                      <div>
                        <label
                          htmlFor={`status-${centre.centre_id}`}
                          className="mb-2 block text-xs font-semibold text-[#68736b]"
                        >
                          Centre Status
                        </label>

                        <select
                          id={`status-${centre.centre_id}`}
                          value={draft?.status || centre.status}
                          onChange={(event) =>
                            updateDraft(
                              centre.centre_id,
                              "status",
                              event.target.value
                            )
                          }
                          className="w-full rounded-xl border border-[#d9d4c8] bg-[#faf9f6] px-3.5 py-3 text-sm font-medium outline-none focus:border-[#244b3a]"
                        >
                          {STATUS_OPTIONS.map((status) => (
                            <option key={status} value={status}>
                              {statusLabel(status)}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="grid gap-4 sm:grid-cols-3">
                        <div>
                          <label
                            htmlFor={`queue-${centre.centre_id}`}
                            className="mb-2 block text-xs font-semibold text-[#68736b]"
                          >
                            Queue Length
                          </label>

                          <input
                            id={`queue-${centre.centre_id}`}
                            type="number"
                            min="0"
                            value={draft?.queue_length ?? ""}
                            onChange={(event) =>
                              updateDraft(
                                centre.centre_id,
                                "queue_length",
                                event.target.value
                              )
                            }
                            className="w-full rounded-xl border border-[#d9d4c8] bg-[#faf9f6] px-3.5 py-3 text-sm font-medium outline-none focus:border-[#244b3a]"
                          />
                        </div>

                        <div>
                          <label
                            htmlFor={`counters-${centre.centre_id}`}
                            className="mb-2 block text-xs font-semibold text-[#68736b]"
                          >
                            Active Counters
                          </label>

                          <input
                            id={`counters-${centre.centre_id}`}
                            type="number"
                            min="0"
                            value={draft?.active_counters ?? ""}
                            onChange={(event) =>
                              updateDraft(
                                centre.centre_id,
                                "active_counters",
                                event.target.value
                              )
                            }
                            className="w-full rounded-xl border border-[#d9d4c8] bg-[#faf9f6] px-3.5 py-3 text-sm font-medium outline-none focus:border-[#244b3a]"
                          />
                        </div>

                        <div>
                          <label
                            htmlFor={`capacity-${centre.centre_id}`}
                            className="mb-2 block text-xs font-semibold text-[#68736b]"
                          >
                            Capacity %
                          </label>

                          <input
                            id={`capacity-${centre.centre_id}`}
                            type="number"
                            min="0"
                            max="100"
                            value={draft?.capacity_used_pct ?? ""}
                            onChange={(event) =>
                              updateDraft(
                                centre.centre_id,
                                "capacity_used_pct",
                                event.target.value
                              )
                            }
                            className="w-full rounded-xl border border-[#d9d4c8] bg-[#faf9f6] px-3.5 py-3 text-sm font-medium outline-none focus:border-[#244b3a]"
                          />
                        </div>
                      </div>

                      <button
                        onClick={() => saveCentre(centre)}
                        disabled={isUpdating}
                        className="w-full rounded-xl bg-[#244b3a] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#1d3f30] disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {isUpdating ? "Saving Changes..." : "Save Centre State"}
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <footer className="py-10 text-center text-xs text-[#8a918b]">
          ProcureSmart • Smart India Hackathon 2026
        </footer>
      </div>
    </main>
  );
}
