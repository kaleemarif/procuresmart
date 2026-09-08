"use client";

import { useEffect, useMemo, useState } from "react";
import {
  createBooking,
  getBooking,
  getNotifications,
  getSlots,
  recommendCentres,
  registerFarmer,
} from "@/lib/api";

const STATUS_ORDER = [
  "Booked",
  "Arrived",
  "Verification",
  "Weighing",
  "Procured",
  "Payment Initiated",
  "Payment Completed",
];

export default function ProcurementPage() {
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [village, setVillage] = useState("");
  const [crop, setCrop] = useState("Wheat");
  const [quantity, setQuantity] = useState("25");

  const [lat, setLat] = useState<number | undefined>();
  const [lon, setLon] = useState<number | undefined>();

  const [farmerId, setFarmerId] = useState("");
  const [farmerCode, setFarmerCode] = useState("");

  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [centreId, setCentreId] = useState("");

  const [slots, setSlots] = useState<any[]>([]);
  const [slotDate, setSlotDate] = useState("");
  const [selectedSlot, setSelectedSlot] = useState<any>(null);

  const [bookingId, setBookingId] = useState("");
  const [booking, setBooking] = useState<any>(null);
  const [notifications, setNotifications] = useState<any[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const selectedCentre = useMemo(
    () => recommendations.find((item) => item.centre_id === centreId),
    [recommendations, centreId]
  );

  useEffect(() => {
    const savedFarmer = localStorage.getItem("procuresmart_farmer_id");
    const savedCode = localStorage.getItem("procuresmart_farmer_code");
    const savedBooking = localStorage.getItem("procuresmart_booking_id");

    if (savedFarmer) setFarmerId(savedFarmer);
    if (savedCode) setFarmerCode(savedCode);

    if (savedBooking) {
      setBookingId(savedBooking);
      loadBooking(savedBooking, savedFarmer || "");
    }
  }, []);

  async function loadBooking(
    id: string,
    currentFarmerId = farmerId
  ) {
    try {
      const data = await getBooking(id);

      setBooking(data.booking);
      setStep(4);

      const fid = data.booking?.farmer_id || currentFarmerId;

      if (fid) {
        const n = await getNotifications(fid);
        setNotifications(n.notifications || []);
      }
    } catch {
      localStorage.removeItem("procuresmart_booking_id");
    }
  }

  function useLocation() {
    if (!navigator.geolocation) {
      return setError(
        "Location is not supported by this browser."
      );
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLat(position.coords.latitude);
        setLon(position.coords.longitude);
        setError("");
      },
      () =>
        setError(
          "Location permission was not available. You can continue with demo mode."
        )
    );
  }

  async function registerAndRecommend() {
    setLoading(true);
    setError("");

    try {
      const reg = await registerFarmer({
        name,
        mobile,
        village,
        crop,
        quantity_quintals: Number(quantity),
        latitude: lat,
        longitude: lon,
      });

      setFarmerId(reg.farmer_id);
      setFarmerCode(reg.farmer_code);

      localStorage.setItem(
        "procuresmart_farmer_id",
        reg.farmer_id
      );

      localStorage.setItem(
        "procuresmart_farmer_code",
        reg.farmer_code
      );

      const result = await recommendCentres({
        crop,
        quantity_quintals: Number(quantity),
        hour: new Date().getHours(),
        day_of_week: new Date().getDay(),
        weather: "Clear",
        farmer_latitude: lat,
        farmer_longitude: lon,
      });

      const list =
        result.recommendations ||
        result.alternatives ||
        [];

      setRecommendations(
        result.recommended_centre
          ? [
              result.recommended_centre,
              ...list,
            ].filter(
              (item, index, arr) =>
                arr.findIndex(
                  (x) =>
                    x.centre_id === item.centre_id
                ) === index
            )
          : list
      );

      setStep(2);
    } catch (e: any) {
      setError(
        e.message ||
          "Could not complete registration."
      );
    } finally {
      setLoading(false);
    }
  }

  async function loadSlots(id: string) {
    setCentreId(id);
    setSelectedSlot(null);
    setLoading(true);
    setError("");

    try {
      const date =
        slotDate ||
        new Date(
          Date.now() + 86400000
        )
          .toISOString()
          .slice(0, 10);

      setSlotDate(date);

      const data = await getSlots({
        centre_id: id,
        slot_date: date,
      });

      setSlots(data.slots || []);
      setStep(3);
    } catch (e: any) {
      setError(
        e.message ||
          "Could not load slots."
      );
    } finally {
      setLoading(false);
    }
  }

  async function bookSlot() {
    if (!selectedSlot || !farmerId || !centreId) {
      return;
    }

    setLoading(true);
    setError("");

    try {
      const result = await createBooking({
        farmer_id: farmerId,
        centre_id: centreId,
        crop,
        quantity_quintals: Number(quantity),
        slot_date: slotDate,
        slot_start: selectedSlot.start,
        slot_end: selectedSlot.end,
      });

      setBookingId(
        result.booking.booking_id
      );

      localStorage.setItem(
        "procuresmart_booking_id",
        result.booking.booking_id
      );

      await loadBooking(
        result.booking.booking_id
      );
    } catch (e: any) {
      setError(
        e.message ||
          "Booking failed."
      );
    } finally {
      setLoading(false);
    }
  }

  const currentIndex = booking
    ? STATUS_ORDER.indexOf(
        booking.booking_status
      )
    : -1;

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 text-slate-900">
      <div className="mx-auto max-w-4xl space-y-5">

        <header className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-600">
                ProcureSmart
              </p>

              <h1 className="mt-1 text-2xl font-bold">
                Farmer Procurement Journey
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                Register → Find centre → Book slot →
                Track procurement → Track payment
              </p>
            </div>

            {farmerCode && (
              <span className="rounded-full bg-slate-100 px-3 py-2 text-xs font-semibold">
                {farmerCode}
              </span>
            )}
          </div>
        </header>

        <div className="grid grid-cols-4 gap-2">
          {[
            "Register",
            "Centre",
            "Slot",
            "Status",
          ].map((label, index) => (
            <div
              key={label}
              className={`rounded-xl px-3 py-2 text-center text-xs font-semibold ${
                step >= index + 1
                  ? "bg-slate-900 text-white"
                  : "border border-slate-200 bg-white text-slate-400"
              }`}
            >
              {index + 1}. {label}
            </div>
          ))}
        </div>

        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {step === 1 && (
          <section className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold">
              Farmer registration
            </h2>

            <div className="grid gap-3 sm:grid-cols-2">
              <input
                className="rounded-xl border p-3"
                placeholder="Farmer name"
                value={name}
                onChange={(e) =>
                  setName(e.target.value)
                }
              />

              <input
                className="rounded-xl border p-3"
                placeholder="Mobile number"
                value={mobile}
                onChange={(e) =>
                  setMobile(e.target.value)
                }
              />

              <input
                className="rounded-xl border p-3"
                placeholder="Village"
                value={village}
                onChange={(e) =>
                  setVillage(e.target.value)
                }
              />

              <select
                className="rounded-xl border p-3"
                value={crop}
                onChange={(e) =>
                  setCrop(e.target.value)
                }
              >
                <option>Wheat</option>
                <option>Rice</option>
                <option>Soybean</option>
              </select>

              <input
                className="rounded-xl border p-3"
                type="number"
                min="1"
                placeholder="Quantity (quintals)"
                value={quantity}
                onChange={(e) =>
                  setQuantity(e.target.value)
                }
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={useLocation}
                className="rounded-xl border px-4 py-3 text-sm font-semibold"
              >
                {lat
                  ? "Location Added ✓"
                  : "Use My Location"}
              </button>

              <button
                disabled={
                  loading ||
                  !name ||
                  !quantity
                }
                onClick={
                  registerAndRecommend
                }
                className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white disabled:opacity-50"
              >
                {loading
                  ? "Checking…"
                  : "Register & Find Best Centre"}
              </button>
            </div>
          </section>
        )}

        {step === 2 && (
          <section className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div>
              <h2 className="text-lg font-bold">
                Recommended procurement centre
              </h2>

              <p className="text-sm text-slate-500">
                Recommendation uses waiting time,
                distance, queue and capacity.
              </p>
            </div>

            <div className="space-y-3">
              {recommendations
                .slice(0, 4)
                .map((item, index) => (
                  <button
                    key={item.centre_id}
                    onClick={() =>
                      loadSlots(
                        item.centre_id
                      )
                    }
                    className={`w-full rounded-2xl border p-4 text-left transition hover:border-slate-500 ${
                      index === 0
                        ? "border-emerald-400 bg-emerald-50"
                        : "border-slate-200"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-bold">
                          {index === 0
                            ? "Recommended · "
                            : "Alternative · "}
                          {item.centre_name}
                        </p>

                        <p className="text-xs text-slate-500">
                          {item.centre_id} ·{" "}
                          {item.distance_km ??
                            "—"}{" "}
                          km · Queue{" "}
                          {item.queue_length}
                        </p>
                      </div>

                      <span className="text-sm font-bold">
                        {
                          item.predicted_waiting_time_minutes
                        }{" "}
                        min
                      </span>
                    </div>
                  </button>
                ))}
            </div>
          </section>
        )}

        {step === 3 && (
          <section className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div>
              <h2 className="text-lg font-bold">
                Book a procurement slot
              </h2>

              <p className="text-sm text-slate-500">
                {selectedCentre?.centre_name ||
                  centreId}
              </p>
            </div>

            <input
              type="date"
              className="rounded-xl border p-3"
              value={slotDate}
              onChange={async (e) => {
                setSlotDate(
                  e.target.value
                );

                const data =
                  await getSlots({
                    centre_id:
                      centreId,
                    slot_date:
                      e.target.value,
                  });

                setSlots(
                  data.slots || []
                );
              }}
            />

            <div className="grid gap-3 sm:grid-cols-2">
              {slots.map((slot) => (
                <button
                  key={slot.slot_id}
                  disabled={
                    slot.remaining <= 0
                  }
                  onClick={() =>
                    setSelectedSlot(
                      slot
                    )
                  }
                  className={`rounded-2xl border p-4 text-left ${
                    selectedSlot?.slot_id ===
                    slot.slot_id
                      ? "border-slate-900 bg-slate-50"
                      : "border-slate-200"
                  } disabled:opacity-40`}
                >
                  <p className="font-bold">
                    {slot.start} –{" "}
                    {slot.end}
                  </p>

                  <p className="text-xs text-slate-500">
                    {slot.remaining} slots
                    remaining{" "}
                    {slot.recommended
                      ? "· Recommended"
                      : ""}
                  </p>
                </button>
              ))}
            </div>

            <button
              disabled={
                !selectedSlot ||
                loading
              }
              onClick={bookSlot}
              className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white disabled:opacity-50"
            >
              {loading
                ? "Confirming…"
                : "Confirm Slot & Generate Token"}
            </button>
          </section>
        )}

        {step === 4 && booking && (
          <section className="space-y-4">

            <div className="rounded-3xl bg-slate-900 p-6 text-white shadow-sm">
              <p className="text-xs uppercase tracking-widest text-slate-300">
                Digital Token
              </p>

              <p className="mt-2 text-4xl font-black">
                {booking.token}
              </p>

              <p className="mt-2 text-sm text-slate-300">
                {booking.slot_date} ·{" "}
                {String(
                  booking.slot_start
                ).slice(0, 5)}
                –
                {String(
                  booking.slot_end
                ).slice(0, 5)}
                · {booking.centre_id}
              </p>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-bold">
                Procurement & payment status
              </h2>

              <div className="mt-5 space-y-4">
                {STATUS_ORDER.map(
                  (status, index) => (
                    <div
                      key={status}
                      className="flex gap-3"
                    >
                      <div
                        className={`mt-1 h-4 w-4 shrink-0 rounded-full ${
                          index <= currentIndex
                            ? "bg-emerald-500"
                            : "bg-slate-200"
                        }`}
                      />

                      <div>
                        <p
                          className={`text-sm font-semibold ${
                            index <=
                            currentIndex
                              ? "text-slate-900"
                              : "text-slate-400"
                          }`}
                        >
                          {status}
                        </p>

                        {index ===
                          currentIndex && (
                          <p className="text-xs text-slate-500">
                            Current status
                          </p>
                        )}
                      </div>
                    </div>
                  )
                )}
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold">
                  Notifications
                </h2>

                <button
                  onClick={() =>
                    loadBooking(
                      bookingId
                    )
                  }
                  className="text-xs font-semibold text-slate-500"
                >
                  Refresh
                </button>
              </div>

              <div className="mt-3 space-y-2">
                {notifications.length ? (
                  notifications.map(
                    (n) => (
                      <div
                        key={
                          n.notification_id
                        }
                        className="rounded-2xl bg-slate-50 p-3"
                      >
                        <p className="text-sm font-semibold">
                          {n.title}
                        </p>

                        <p className="text-xs text-slate-500">
                          {n.message}
                        </p>
                      </div>
                    )
                  )
                ) : (
                  <p className="text-sm text-slate-400">
                    No notifications yet.
                  </p>
                )}
              </div>
            </div>

          </section>
        )}

        <p className="text-center text-xs text-slate-400">
          Prototype uses synthetic/demo
          operational data. Demo centres are not
          official government locations.
        </p>

      </div>
    </main>
  );
                         }
