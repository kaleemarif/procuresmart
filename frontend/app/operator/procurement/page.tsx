"use client";

import { useEffect, useState } from "react";
import {
  getOperatorBookings,
  updateBookingStatus,
} from "@/lib/api";

const STATUS_OPTIONS = [
  "Booked",
  "Arrived",
  "Verification",
  "Weighing",
  "Procured",
  "Payment Initiated",
  "Payment Completed",
] as const;

type BookingStatus = (typeof STATUS_OPTIONS)[number];

type Booking = {
  booking_id: string;
  token: string;
  farmer_id: string;
  centre_id: string;
  crop: string;
  quantity_quintals: number;
  slot_date: string;
  slot_start: string;
  slot_end: string;
  booking_status: BookingStatus;
  payment_status: string;
  created_at?: string;
  updated_at?: string;
};

export default function ProcurementPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function loadBookings() {
    setLoading(true);
    setError("");

    try {
      const data = await getOperatorBookings();
      setBookings(data.bookings || []);
    } catch (e: any) {
      setError(
        e?.message || "Could not load procurement bookings."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadBookings();
  }, []);

  async function changeStatus(
    bookingId: string,
    status: BookingStatus
  ) {
    setUpdatingId(bookingId);
    setError("");

    try {
      await updateBookingStatus(bookingId, status);
      await loadBookings();
    } catch (e: any) {
      setError(
        e?.message || "Could not update booking status."
      );
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 text-slate-900">
      <div className="mx-auto max-w-7xl space-y-5">

        <header className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-600">
                ProcureSmart
              </p>

              <h1 className="mt-1 text-2xl font-bold">
                Operator Procurement Control
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                Manage farmer bookings, procurement progress and payment status.
              </p>
            </div>

            <button
              onClick={loadBookings}
              disabled={loading}
              className="rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white disabled:opacity-50"
            >
              {loading ? "Refreshing..." : "Refresh"}
            </button>
          </div>
        </header>

        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="grid gap-3 sm:grid-cols-3">

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Total Bookings
            </p>

            <p className="mt-2 text-3xl font-black">
              {bookings.length}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Active
            </p>

            <p className="mt-2 text-3xl font-black">
              {
                bookings.filter(
                  (booking) =>
                    booking.booking_status !==
                    "Payment Completed"
                ).length
              }
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Completed
            </p>

            <p className="mt-2 text-3xl font-black">
              {
                bookings.filter(
                  (booking) =>
                    booking.booking_status ===
                    "Payment Completed"
                ).length
              }
            </p>
          </div>

        </div>

        <section className="rounded-3xl border border-slate-200 bg-white shadow-sm">

          <div className="border-b border-slate-200 p-5">
            <h2 className="text-lg font-bold">
              Farmer Procurement Bookings
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Update the verified procurement status from arrival to payment completion.
            </p>
          </div>

          {loading ? (
            <div className="p-8 text-center text-sm text-slate-500">
              Loading bookings...
            </div>
          ) : bookings.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-500">
              No procurement bookings found.
            </div>
          ) : (
            <div className="overflow-x-auto">

              <table className="w-full min-w-[1000px] text-sm">

                <thead className="bg-slate-50 text-left">
                  <tr>
                    <th className="px-4 py-3 font-semibold">
                      Token
                    </th>

                    <th className="px-4 py-3 font-semibold">
                      Centre
                    </th>

                    <th className="px-4 py-3 font-semibold">
                      Crop
                    </th>

                    <th className="px-4 py-3 font-semibold">
                      Quantity
                    </th>

                    <th className="px-4 py-3 font-semibold">
                      Slot
                    </th>

                    <th className="px-4 py-3 font-semibold">
                      Status
                    </th>

                    <th className="px-4 py-3 font-semibold">
                      Payment
                    </th>
                  </tr>
                </thead>

                <tbody>

                  {bookings.map((booking) => (
                    <tr
                      key={booking.booking_id}
                      className="border-t border-slate-100"
                    >

                      <td className="px-4 py-4">
                        <span className="rounded-lg bg-slate-900 px-3 py-2 font-bold text-white">
                          {booking.token}
                        </span>
                      </td>

                      <td className="px-4 py-4">
                        <p className="font-semibold">
                          {booking.centre_id}
                        </p>
                      </td>

                      <td className="px-4 py-4">
                        {booking.crop}
                      </td>

                      <td className="px-4 py-4">
                        {booking.quantity_quintals} q
                      </td>

                      <td className="px-4 py-4">
                        <p className="font-medium">
                          {booking.slot_date}
                        </p>

                        <p className="text-xs text-slate-500">
                          {String(
                            booking.slot_start
                          ).slice(0, 5)}
                          {" – "}
                          {String(
                            booking.slot_end
                          ).slice(0, 5)}
                        </p>
                      </td>

                      <td className="px-4 py-4">

                        <select
                          value={booking.booking_status}
                          disabled={
                            updatingId ===
                            booking.booking_id
                          }
                          onChange={(e) =>
                            changeStatus(
                              booking.booking_id,
                              e.target.value as BookingStatus
                            )
                          }
                          className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-medium outline-none focus:border-slate-500 disabled:opacity-50"
                        >

                          {STATUS_OPTIONS.map(
                            (status) => (
                              <option
                                key={status}
                                value={status}
                              >
                                {status}
                              </option>
                            )
                          )}

                        </select>

                        {updatingId ===
                          booking.booking_id && (
                          <p className="mt-1 text-xs text-slate-400">
                            Updating...
                          </p>
                        )}

                      </td>

                      <td className="px-4 py-4">
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold">
                          {booking.payment_status}
                        </span>
                      </td>

                    </tr>
                  ))}

                </tbody>

              </table>

            </div>
          )}

        </section>

        <p className="text-center text-xs text-slate-400">
          Prototype uses synthetic/demo procurement data.
        </p>

      </div>
    </main>
  );
}
