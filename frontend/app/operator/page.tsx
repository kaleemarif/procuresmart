"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "https://procuresmart-cxx8.onrender.com";

type Centre = {
  centre_id: string;
  name: string;
  lat: number;
  lon: number;
  queue_length: number;
  active_counters: number;
  avg_processing_time: number;
  capacity_used_pct: number;
  status: "open" | "paused" | "closed";
  updated_at?: string | null;
};

type CentreDraft = {
  status: Centre["status"];
  active_counters: number;
  queue_length: number;
  capacity_used_pct: number;
};

const statusConfig = {
  open: {
    label: "Open",
    dot: "bg-emerald-500",
    badge: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  paused: {
    label: "Paused",
    dot: "bg-amber-500",
    badge: "bg-amber-50 text-amber-700 border-amber-200",
  },
  closed: {
    label: "Closed",
    dot: "bg-red-500",
    badge: "bg-red-50 text-red-700 border-red-200",
  },
};

function estimatedWait(centre: Centre) {
  if (centre.active_counters <= 0) return null;

  return Math.max(
    0,
    Math.round(
      (centre.queue_length * centre.avg_processing_time) /
        centre.active_counters
    )
  );
}

function formatUpdatedAt(value?: string | null) {
  if (!value) return "Not available";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Not available";

  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function OperatorPage() {
  const [centres, setCentres] = useState<Centre[]>([]);
  const [drafts, setDrafts] = useState<Record<string, CentreDraft>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updating, setUpdating] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState("");

  const loadCentres = useCallback(async (silent = false) => {
    try {
      if (silent) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const response = await fetch(`${API_URL}/operator/centres`, {
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("Unable to load procurement centre data.");
      }

      const data = await response.json();
      const incomingCentres: Centre[] = data.centres || [];

      setCentres(incomingCentres);

      const nextDrafts: Record<string, CentreDraft> = {};

      incomingCentres.forEach((centre) => {
        nextDrafts[centre.centre_id] = {
          status: centre.status,
          active_counters: centre.active_counters,
          queue_length: centre.queue_length,
          capacity_used_pct: centre.capacity_used_pct,
        };
      });

      setDrafts(nextDrafts);
      setLastUpdated(formatUpdatedAt(data.updated_at));
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong while loading data."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadCentres();
  }, [loadCentres]);

  const summary = useMemo(() => {
    const open = centres.filter((c) => c.status === "open").length;
    const paused = centres.filter((c) => c.status === "paused").length;
    const closed = centres.filter((c) => c.status === "closed").length;

    const totalQueue = centres.reduce(
      (sum, centre) => sum + centre.queue_length,
      0
    );

    const averageCapacity =
      centres.length > 0
        ? Math.round(
            centres.reduce(
              (sum, centre) => sum + centre.capacity_used_pct,
              0
            ) / centres.length
          )
        : 0;

    return {
      total: centres.length,
      open,
      paused,
      closed,
      totalQueue,
      averageCapacity,
    };
  }, [centres]);

  function updateDraft(
    centreId: string,
    field: keyof CentreDraft,
    value: string | number
  ) {
    setDrafts((current) => ({
      ...current,
      [centreId]: {
        ...current[centreId],
        [field]: value,
      },
    }));
  }

  function adjustNumber(
    centreId: string,
    field: "active_counters" | "queue_length" | "capacity_used_pct",
    amount: number
  ) {
    const current = drafts[centreId];

    if (!current) return;

    const limits = {
      active_counters: { min: 0, max: 20 },
      queue_length: { min: 0, max: 999 },
      capacity_used_pct: { min: 0, max: 100 },
    };

    const nextValue = Math.min(
      limits[field].max,
      Math.max(limits[field].min, current[field] + amount)
    );

    updateDraft(centreId, field, nextValue);
  }

  async function saveCentre(centreId: string) {
    const draft = drafts[centreId];

    if (!draft) return;

    try {
      setUpdating(centreId);
      setError("");

      const response = await fetch(
        `${API_URL}/operator/centre-state/${centreId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status: draft.status,
            active_counters: draft.active_counters,
            queue_length: draft.queue_length,
            capacity_used_pct: draft.capacity_used_pct,
          }),
        }
      );

      if (!response.ok) {
        const data = await response.json().catch(() => null);

        throw new Error(
          data?.detail || "Unable to update centre state."
        );
      }

      await loadCentres(true);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to update centre state."
      );
    } finally {
      setUpdating(null);
    }
  }

  return (
    <main className="min-h-screen bg-[#f5f2ea] text-[#25352d]">
      {/* Header */}
      <header className="border-b border-[#ddd7ca] bg-[#faf8f2]">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 lg:px-8">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#244b3a] text-lg font-bold text-white">
                P
              </div>

              <div>
                <p className="text-lg font-bold tracking-tight">
                  ProcureSmart
                </p>
                <p className="text-xs text-[#758078]">
                  Operator Dashboard
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/farmer"
              className="hidden rounded-xl border border-[#d8d2c5] bg-white px-4 py-2.5 text-sm font-semibold text-[#405048] transition hover:bg-[#f3f0e8] sm:block"
            >
              Farmer View
            </Link>

            <button
              onClick={() => loadCentres(true)}
              disabled={refreshing}
              className="rounded-xl bg-[#244b3a] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#193b2c] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {refreshing ? "Refreshing..." : "Refresh Live Data"}
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-5 py-7 lg:px-8">
        {/* Page intro */}
        <section className="mb-7">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-[#708077]">
                Operations
              </p>

              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Procurement Centre Control
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-[#667169]">
                Monitor queue pressure, active counters, capacity and centre
                status in one place.
              </p>
            </div>

            <div className="text-sm text-[#707a73]">
              Last synced:{" "}
              <span className="font-semibold text-[#405048]">
                {lastUpdated || "—"}
              </span>
            </div>
          </div>
        </section>

        {/* Prototype banner */}
        <div className="mb-7 rounded-2xl border border-[#e0d5b6] bg-[#fffaf0] px-5 py-4">
          <div className="flex gap-3">
            <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#ead9a9] text-sm">
              i
            </div>

            <div>
              <p className="text-sm font-bold text-[#5d4d27]">
                Prototype / Demo Mode
              </p>

              <p className="mt-1 text-sm leading-5 text-[#756a4d]">
                Centre data is synthetic for the SIH prototype. Operator
                changes are maintained in the current backend session and may
                reset if the backend restarts.
              </p>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-7 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
            <span className="font-bold">Error:</span> {error}
          </div>
        )}

        {/* Summary cards */}
        <section className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-5">
          <SummaryCard
            label="Total Centres"
            value={loading ? "—" : summary.total}
            helper="Monitored"
          />

          <SummaryCard
            label="Open"
            value={loading ? "—" : summary.open}
            helper="Operational"
            valueClass="text-emerald-700"
          />

          <SummaryCard
            label="Paused / Closed"
            value={
              loading
                ? "—"
                : `${summary.paused} / ${summary.closed}`
            }
            helper="Attention"
            valueClass="text-amber-700"
          />

          <SummaryCard
            label="Total Queue"
            value={loading ? "—" : summary.totalQueue}
            helper="Farmers waiting"
          />

          <SummaryCard
            label="Avg. Capacity"
            value={loading ? "—" : `${summary.averageCapacity}%`}
            helper="Across centres"
          />
        </section>

        {/* Loading */}
        {loading ? (
          <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className="h-[430px] animate-pulse rounded-3xl border border-[#ddd7ca] bg-white"
              />
            ))}
          </section>
        ) : centres.length === 0 ? (
          <section className="rounded-3xl border border-[#ddd7ca] bg-white p-10 text-center">
            <h2 className="text-lg font-bold">No centres available</h2>
            <p className="mt-2 text-sm text-[#707a73]">
              The backend did not return any procurement centres.
            </p>
          </section>
        ) : (
          <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {centres.map((centre) => {
              const draft = drafts[centre.centre_id];
              const wait = estimatedWait(centre);
              const config = statusConfig[centre.status];

              if (!draft) return null;

              return (
                <article
                  key={centre.centre_id}
                  className="overflow-hidden rounded-3xl border border-[#ddd7ca] bg-white shadow-[0_8px_30px_rgba(48,59,52,0.05)]"
                >
                  {/* Card header */}
                  <div className="border-b border-[#ece8df] px-5 py-5">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="mb-1 flex items-center gap-2">
                          <span className="rounded-md bg-[#edf1eb] px-2 py-1 font-mono text-xs font-bold text-[#496052]">
                            {centre.centre_id}
                          </span>
                        </div>

                        <h2 className="text-lg font-bold text-[#26362e]">
                          {centre.name}
                        </h2>
                      </div>

                      <span
                        className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold ${config.badge}`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${config.dot}`}
                        />
                        {config.label}
                      </span>
                    </div>
                  </div>

                  {/* Metrics */}
                  <div className="grid grid-cols-3 divide-x divide-[#ece8df] border-b border-[#ece8df]">
                    <Metric
                      label="Queue"
                      value={centre.queue_length}
                    />

                    <Metric
                      label="Counters"
                      value={centre.active_counters}
                    />

                    <Metric
                      label="Capacity"
                      value={`${Math.round(
                        centre.capacity_used_pct
                      )}%`}
                    />
                  </div>

                  <div className="px-5 py-5">
                    {/* Wait estimate */}
                    <div className="mb-5 rounded-2xl bg-[#f5f3ed] px-4 py-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold uppercase tracking-wide text-[#7a827c]">
                          Estimated wait
                        </span>

                        <span className="text-lg font-bold text-[#294638]">
                          {wait === null ? "—" : `${wait} min`}
                        </span>
                      </div>

                      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#dedbd2]">
                        <div
                          className="h-full rounded-full bg-[#668b73]"
                          style={{
                            width: `${Math.min(
                              centre.capacity_used_pct,
                              100
                            )}%`,
                          }}
                        />
                      </div>
                    </div>

                    {/* Status */}
                    <label className="mb-4 block">
                      <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-[#747d76]">
                        Centre status
                      </span>

                      <select
                        value={draft.status}
                        onChange={(event) =>
                          updateDraft(
                            centre.centre_id,
                            "status",
                            event.target.value
                          )
                        }
                        className="w-full rounded-xl border border-[#d8d2c5] bg-white px-3 py-2.5 text-sm font-semibold outline-none focus:border-[#6d8b77] focus:ring-2 focus:ring-[#dce7df]"
                      >
                        <option value="open">Open</option>
                        <option value="paused">Paused</option>
                        <option value="closed">Closed</option>
                      </select>
                    </label>

                    {/* Queue */}
                    <ControlRow
                      label="Queue length"
                      value={draft.queue_length}
                      onDecrease={() =>
                        adjustNumber(
                          centre.centre_id,
                          "queue_length",
                          -1
                        )
                      }
                      onIncrease={() =>
                        adjustNumber(
                          centre.centre_id,
                          "queue_length",
                          1
                        )
                      }
                    />

                    {/* Counters */}
                    <ControlRow
                      label="Active counters"
                      value={draft.active_counters}
                      onDecrease={() =>
                        adjustNumber(
                          centre.centre_id,
                          "active_counters",
                          -1
                        )
                      }
                      onIncrease={() =>
                        adjustNumber(
                          centre.centre_id,
                          "active_counters",
                          1
                        )
                      }
                    />

                    {/* Capacity */}
                    <ControlRow
                      label="Capacity used"
                      value={`${draft.capacity_used_pct}%`}
                      onDecrease={() =>
                        adjustNumber(
                          centre.centre_id,
                          "capacity_used_pct",
                          -5
                        )
                      }
                      onIncrease={() =>
                        adjustNumber(
                          centre.centre_id,
                          "capacity_used_pct",
                          5
                        )
                      }
                    />

                    {/* Save */}
                    <button
                      onClick={() => saveCentre(centre.centre_id)}
                      disabled={updating === centre.centre_id}
                      className="mt-5 w-full rounded-xl bg-[#244b3a] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#193b2c] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {updating === centre.centre_id
                        ? "Saving..."
                        : "Update Centre State"}
                    </button>

                    <p className="mt-3 text-center text-[11px] text-[#90968f]">
                      Last update: {formatUpdatedAt(centre.updated_at)}
                    </p>
                  </div>
                </article>
              );
            })}
          </section>
        )}

        {/* Footer */}
        <footer className="mt-10 border-t border-[#ddd7ca] pt-6 text-center text-xs text-[#858d86]">
          ProcureSmart • Operator Control Layer • Synthetic Prototype Data
        </footer>
      </div>
    </main>
  );
}

function SummaryCard({
  label,
  value,
  helper,
  valueClass = "text-[#26362e]",
}: {
  label: string;
  value: string | number;
  helper: string;
  valueClass?: string;
}) {
  return (
    <div className="rounded-2xl border border-[#ddd7ca] bg-white px-5 py-4 shadow-[0_5px_20px_rgba(48,59,52,0.04)]">
      <p className="text-xs font-bold uppercase tracking-wide text-[#7b847d]">
        {label}
      </p>

      <p className={`mt-2 text-2xl font-bold ${valueClass}`}>
        {value}
      </p>

      <p className="mt-1 text-xs text-[#929991]">{helper}</p>
    </div>
  );
}

function Metric({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="px-3 py-4 text-center">
      <p className="text-lg font-bold text-[#2c4035]">{value}</p>
      <p className="mt-1 text-[10px] font-bold uppercase tracking-wide text-[#89918a]">
        {label}
      </p>
    </div>
  );
}

function ControlRow({
  label,
  value,
  onDecrease,
  onIncrease,
}: {
  label: string;
  value: string | number;
  onDecrease: () => void;
  onIncrease: () => void;
}) {
  return (
    <div className="mb-3 flex items-center justify-between rounded-xl border border-[#e5e1d8] px-3 py-2.5">
      <span className="text-sm font-medium text-[#56625a]">
        {label}
      </span>

      <div className="flex items-center gap-2">
        <button
          onClick={onDecrease}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#d8d2c5] text-lg font-semibold text-[#506057] transition hover:bg-[#f2efe7]"
          aria-label={`Decrease ${label}`}
        >
          −
        </button>

        <span className="min-w-[42px] text-center text-sm font-bold text-[#293b31]">
          {value}
        </span>

        <button
          onClick={onIncrease}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#d8d2c5] text-lg font-semibold text-[#506057] transition hover:bg-[#f2efe7]"
          aria-label={`Increase ${label}`}
        >
          +
        </button>
      </div>
    </div>
  );
}
