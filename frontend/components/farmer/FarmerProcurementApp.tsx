"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import {
  createBooking,
  getBooking,
  getSlots,
  recommendCentres,
  registerFarmer,
} from "@/lib/api";

const ProcurementMap = dynamic(() => import("@/components/farmer/ProcurementMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[360px] items-center justify-center rounded-2xl border border-[#d8d2c5] bg-[#e9e5da] text-sm text-[#667169]">
      Loading map...
    </div>
  ),
});

type Screen =
  | "entry" | "login" | "dashboard" | "disclosure" | "crop" | "quantity"
  | "location" | "prediction" | "recommendation" | "details" | "best-time"
  | "booking" | "token" | "activity" | "no-centre" | "error";

type Crop = { id: string; name: string; hindi: string; image: string };
type LocationMode = "gps" | "manual";
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
  booking_status: string;
  payment_status: string;
};

type Slot = {
  slot_id: string;
  start: string;
  end: string;
  capacity: number;
  booked: number;
  remaining: number;
  recommended?: boolean;
};

const crops: Crop[] = [
  { id: "Wheat", name: "Wheat", hindi: "गेहूँ", image: "/images/crops/wheat.webp" },
  { id: "Soybean", name: "Soybean", hindi: "सोयाबीन", image: "/images/crops/soybean.webp" },
  { id: "Rice", name: "Rice", hindi: "धान", image: "/images/crops/rice.webp" },
  { id: "Gram", name: "Gram", hindi: "चना", image: "/images/crops/gram.webp" },
  { id: "Maize", name: "Maize", hindi: "मक्का", image: "/images/crops/maize.webp" },
];

function ArrowRightIcon() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14"/><path d="m13 6 6 6-6 6"/></svg>; }
function ArrowLeftIcon() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m15 18-6-6 6-6"/></svg>; }
function LocationIcon() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/></svg>; }
function ClockIcon() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>; }
function InfoIcon() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="9"/><path d="M12 10v6"/><circle cx="12" cy="7.2" r=".7" fill="currentColor" stroke="none"/></svg>; }
function CheckIcon() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m5 12 4 4L19 6"/></svg>; }
function ActivityIcon() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M4 18V9"/><path d="M10 18V5"/><path d="M16 18v-7"/><path d="M22 18V3"/></svg>; }
function PlusIcon() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14"/></svg>; }
function MinusIcon() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14"/></svg>; }

function todayISO() { return new Date().toISOString().slice(0, 10); }

export default function FarmerPage() {
  const [screen, setScreen] = useState<Screen>("entry");
  const [language, setLanguage] = useState<"en" | "hi">("hi");
  const [mobile, setMobile] = useState("");
  const [crop, setCrop] = useState("");
  const [quantity, setQuantity] = useState("50");
  const [locationMode, setLocationMode] = useState<LocationMode>("gps");
  const [manualLocation, setManualLocation] = useState({ state: "Madhya Pradesh", district: "Jabalpur", tehsil: "", village: "" });
  const [gpsLatitude, setGpsLatitude] = useState<number | null>(null);
  const [gpsLongitude, setGpsLongitude] = useState<number | null>(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [recommendation, setRecommendation] = useState<any>(null);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [booking, setBooking] = useState<Booking | null>(null);
  const [error, setError] = useState("");
  const [loadingMessage, setLoadingMessage] = useState("Analysing nearby procurement options...");
  const [bookingLoading, setBookingLoading] = useState(false);
  const [farmerId, setFarmerId] = useState<string | null>(null);

  const centre = recommendation?.recommended_centre;

  useEffect(() => {
    try {
      const savedFarmer = localStorage.getItem("procuresmart_farmer_id");
      const savedBooking = localStorage.getItem("procuresmart_active_booking");
      if (savedFarmer) setFarmerId(savedFarmer);
      if (savedBooking) {
        const parsed = JSON.parse(savedBooking) as Booking;
        if (parsed?.booking_id && parsed?.token) setBooking(parsed);
      }
    } catch {}
  }, []);

  useEffect(() => {
    if (screen !== "prediction") return;
    let cancelled = false;
    async function fetchRecommendation() {
      try {
        setError("");
        const quantityValue = Number(quantity);
        if (!crop) throw new Error("Please select a crop.");
        if (!Number.isFinite(quantityValue) || quantityValue < 5 || quantityValue > 1000) {
          throw new Error("Please enter a quantity between 5 and 1000 quintals.");
        }
        setLoadingMessage("Checking current procurement conditions...");
        const now = new Date();
        const result = await recommendCentres({
          crop,
          quantity_quintals: quantityValue,
          hour: now.getHours(),
          day_of_week: now.getDay(),
          weather: "Clear",
          ...(locationMode === "gps" && gpsLatitude !== null && gpsLongitude !== null
            ? { farmer_latitude: gpsLatitude, farmer_longitude: gpsLongitude }
            : {}),
        });
        if (cancelled) return;
        if (!result?.recommended_centre) { setScreen("no-centre"); return; }
        setRecommendation(result);
        setScreen("recommendation");
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Something went wrong while finding the best centre.");
        setScreen("error");
      }
    }
    fetchRecommendation();
    return () => { cancelled = true; };
  }, [screen, crop, quantity, locationMode, gpsLatitude, gpsLongitude]);

  async function openBooking() {
    if (!centre?.centre_id) { setError("Recommended centre is unavailable."); setScreen("error"); return; }
    try {
      setError("");
      setBookingLoading(true);
      const result = await getSlots({ centre_id: centre.centre_id, slot_date: todayISO() });
      const available = (result?.slots ?? []).filter((slot: Slot) => slot.remaining > 0);
      setSlots(available);
      setSelectedSlot(available.find((slot: Slot) => slot.recommended) ?? available[0] ?? null);
      setScreen("booking");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load procurement slots.");
      setScreen("error");
    } finally { setBookingLoading(false); }
  }

  async function confirmBooking() {
    if (!centre?.centre_id || !selectedSlot) return;
    try {
      setError("");
      setBookingLoading(true);
      let id = farmerId;
      if (!id) {
        const registration = await registerFarmer({
          name: mobile ? `Farmer ${mobile.slice(-4)}` : "Demo Farmer",
          mobile,
          village: manualLocation.village,
          latitude: gpsLatitude ?? undefined,
          longitude: gpsLongitude ?? undefined,
          crop,
        } as any);
        id = registration.farmer_id;
        setFarmerId(id);
        localStorage.setItem("procuresmart_farmer_id", id);
      }

      const result = await createBooking({
        farmer_id: id,
        centre_id: centre.centre_id,
        crop,
        quantity_quintals: Number(quantity),
        slot_date: todayISO(),
        slot_start: selectedSlot.start,
        slot_end: selectedSlot.end,
      });
      const saved = result.booking as Booking;
      const finalBooking: Booking = {
        ...saved,
        token: result.token ?? saved.token,
        booking_status: saved.booking_status ?? "Booked",
      };
      setBooking(finalBooking);
      localStorage.setItem("procuresmart_active_booking", JSON.stringify(finalBooking));
      setScreen("token");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Booking failed. Please try another slot.");
    } finally { setBookingLoading(false); }
  }

  async function refreshBooking() {
    if (!booking?.booking_id) return;
    try {
      const result = await getBooking(booking.booking_id);
      const fresh = result.booking as Booking;
      setBooking(fresh);
      localStorage.setItem("procuresmart_active_booking", JSON.stringify(fresh));
    } catch {}
  }

  function goBack() {
    if (screen === "login") setScreen("entry");
    else if (screen === "dashboard") setScreen("login");
    else if (screen === "disclosure") setScreen("dashboard");
    else if (screen === "crop") setScreen("disclosure");
    else if (screen === "quantity") setScreen("crop");
    else if (screen === "location") setScreen("quantity");
    else if (screen === "recommendation") setScreen("location");
    else if (screen === "details") setScreen("recommendation");
    else if (screen === "best-time") setScreen("details");
    else if (screen === "booking") setScreen("details");
    else if (screen === "token") setScreen("booking");
    else if (screen === "activity") setScreen("dashboard");
  }

  function continueLogin() {
    if (mobile.trim() && mobile.trim().length < 10) { setError("Please enter a valid mobile number."); setScreen("error"); return; }
    setError(""); setScreen("dashboard");
  }

  function continueFromLocation() {
    setError("");
    if (locationMode === "gps" && (gpsLatitude === null || gpsLongitude === null)) { setError("Please use your current location first."); return; }
    if (locationMode === "manual" && (!manualLocation.state.trim() || !manualLocation.district.trim())) { setError("Please enter your state and district."); return; }
    setScreen("prediction");
  }

  function useCurrentLocation() {
    if (!navigator.geolocation) { setError("Location is not supported on this device."); return; }
    setGpsLoading(true); setError("");
    navigator.geolocation.getCurrentPosition(
      (position) => { setGpsLatitude(position.coords.latitude); setGpsLongitude(position.coords.longitude); setLocationMode("gps"); setGpsLoading(false); },
      () => { setGpsLoading(false); setError("We could not access your location. Please allow location permission or enter it manually."); },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 },
    );
  }

  function incrementQuantity() { const current = Number(quantity); setQuantity(String(Math.min(Number.isFinite(current) ? current + 1 : 5, 1000))); }
  function decrementQuantity() { const current = Number(quantity); setQuantity(String(Math.max(Number.isFinite(current) ? current - 1 : 5, 5))); }
  function handleQuantityChange(value: string) { const cleaned = value.replace(/\D/g, "").slice(0, 4); if (!cleaned) { setQuantity(""); return; } setQuantity(String(Math.min(Number(cleaned), 1000))); }

  function resetFlow() {
    setRecommendation(null); setSlots([]); setSelectedSlot(null); setError(""); setScreen("dashboard");
  }

  const activeBooking = booking && ["Booked", "Arrived", "Verification", "Weighing", "Procured", "Payment Initiated"].includes(booking.booking_status) ? booking : null;

  return (
    <main className="min-h-screen bg-[#f7f4ec] text-[#18352a]">
      <div className="mx-auto min-h-screen w-full max-w-md bg-[#f7f4ec] shadow-sm">
        {screen === "entry" && (
          <section className="flex min-h-screen flex-col">
            <div className="flex items-center justify-between px-5 pt-5"><div className="text-sm font-semibold tracking-wide text-[#24543d]">ProcureSmart</div><button onClick={() => setLanguage(language === "hi" ? "en" : "hi")} className="rounded-full border border-[#cdd8cf] bg-white px-3 py-1.5 text-xs font-semibold text-[#24543d]">{language === "hi" ? "हिंदी" : "English"}</button></div>
            <div className="px-5 pt-8"><div className="overflow-hidden rounded-[28px] bg-[#dfe8df]"><img src="/images/farmer-hero.webp" alt="Farmer standing in an agricultural field" className="h-[330px] w-full object-cover" /></div></div>
            <div className="px-6 pb-8 pt-8"><p className="mb-2 text-sm font-semibold uppercase tracking-[0.16em] text-[#b26a27]">Sahi Jankari, Sahi Samay</p><h1 className="text-[34px] font-bold leading-[1.08] tracking-tight text-[#18352a]">Find the right<br/>procurement centre.</h1><p className="mt-4 max-w-[330px] text-[15px] leading-6 text-[#5c695f]">Compare waiting time, queue, distance and capacity before you decide where to take your crop.</p><button onClick={() => setScreen("login")} className="mt-8 flex h-14 w-full items-center justify-center gap-3 rounded-2xl bg-[#1f513a] px-5 text-base font-semibold text-white shadow-sm">Get Started<span className="h-5 w-5"><ArrowRightIcon/></span></button><div className="mt-5 flex items-start gap-2 text-xs leading-5 text-[#69746c]"><span className="mt-0.5 h-4 w-4 shrink-0"><InfoIcon/></span>Prototype powered by synthetic procurement data.</div></div>
          </section>
        )}

        {screen === "login" && (
          <section className="min-h-screen px-5 py-5"><button onClick={goBack} className="flex h-10 w-10 items-center justify-center rounded-full border border-[#d3dbd4] bg-white"><span className="h-5 w-5"><ArrowLeftIcon/></span></button><div className="pt-12"><p className="text-sm font-semibold text-[#b26a27]">Welcome</p><h1 className="mt-2 text-3xl font-bold tracking-tight">Let's get you started.</h1><p className="mt-3 text-sm leading-6 text-[#667169]">Login to continue, or use the app as a guest.</p><div className="mt-9"><label className="text-sm font-semibold text-[#33463a]">Mobile number</label><div className="mt-2 flex h-14 overflow-hidden rounded-2xl border border-[#cfd8d1] bg-white"><div className="flex items-center border-r border-[#e1e6e1] px-4 text-sm font-semibold text-[#536158]">+91</div><input value={mobile} onChange={e => setMobile(e.target.value.replace(/\D/g, "").slice(0,10))} inputMode="numeric" placeholder="Enter mobile number" className="min-w-0 flex-1 bg-transparent px-4 text-base outline-none"/></div></div><button onClick={continueLogin} className="mt-5 flex h-14 w-full items-center justify-center gap-3 rounded-2xl bg-[#1f513a] text-base font-semibold text-white">Continue<span className="h-5 w-5"><ArrowRightIcon/></span></button><div className="my-6 flex items-center gap-3"><div className="h-px flex-1 bg-[#d9ded9]"/><span className="text-xs text-[#89928b]">OR</span><div className="h-px flex-1 bg-[#d9ded9]"/></div><button onClick={() => setScreen("dashboard")} className="h-14 w-full rounded-2xl border border-[#c8d3ca] bg-white text-base font-semibold text-[#24543d]">Continue as Guest</button><p className="mt-5 text-center text-xs leading-5 text-[#7a857d]">OTP verification will be connected in the production version.</p></div></section>
        )}

        {screen === "dashboard" && (
          <section className="min-h-screen px-5 pb-8 pt-5"><div className="flex items-center justify-between"><div><p className="text-xs font-medium text-[#758078]">Welcome back</p><h1 className="mt-1 text-2xl font-bold tracking-tight">Farmer Home</h1></div><button onClick={() => setScreen("activity")} className="flex h-11 w-11 items-center justify-center rounded-full border border-[#d0d9d1] bg-white"><span className="h-5 w-5"><ActivityIcon/></span></button></div>
            {activeBooking && <div className="mt-6 rounded-[26px] border border-[#b9cdbd] bg-[#e8f0e9] p-5"><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#52715b]">Active procurement</p><h2 className="mt-1 text-2xl font-bold text-[#18352a]">Token {activeBooking.token}</h2></div><span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-[#24543d]">{activeBooking.booking_status}</span></div><div className="mt-4 grid grid-cols-2 gap-3 text-sm"><div><div className="text-xs text-[#728077]">Centre</div><div className="font-semibold">{activeBooking.centre_id}</div></div><div><div className="text-xs text-[#728077]">Slot</div><div className="font-semibold">{activeBooking.slot_start?.slice(0,5)}–{activeBooking.slot_end?.slice(0,5)}</div></div><div><div className="text-xs text-[#728077]">Crop</div><div className="font-semibold">{activeBooking.crop}</div></div><div><div className="text-xs text-[#728077]">Quantity</div><div className="font-semibold">{activeBooking.quantity_quintals} qtl</div></div></div><button onClick={() => { refreshBooking(); setScreen("token"); }} className="mt-4 h-11 w-full rounded-xl border border-[#b8cabb] bg-white text-sm font-semibold text-[#24543d]">View Token & Status</button></div>}
            <div className="mt-6 overflow-hidden rounded-[26px] bg-[#dfe8df]"><img src="/images/farmer-hero.webp" alt="Farmer in an agricultural field" className="h-[215px] w-full object-cover"/></div><div className="mt-6"><p className="text-sm font-semibold uppercase tracking-[0.14em] text-[#b26a27]">Procurement guidance</p><h2 className="mt-2 text-2xl font-bold leading-tight">Where should you<br/>take your crop?</h2><p className="mt-3 text-sm leading-6 text-[#667169]">Get a recommendation based on expected waiting time, queue, distance and centre capacity.</p><button onClick={() => setScreen("disclosure")} className="mt-6 flex h-14 w-full items-center justify-center gap-3 rounded-2xl bg-[#1f513a] text-base font-semibold text-white">Find Best Procurement Centre<span className="h-5 w-5"><ArrowRightIcon/></span></button></div><div className="mt-5 grid grid-cols-2 gap-3"><div className="rounded-2xl border border-[#d6ddd7] bg-white p-4"><div className="text-xs font-semibold text-[#7a857d]">Market prices</div><div className="mt-2 text-sm font-semibold text-[#506057]">Coming soon</div></div><button onClick={() => setScreen("activity")} className="rounded-2xl border border-[#d6ddd7] bg-white p-4 text-left"><div className="text-xs font-semibold text-[#7a857d]">My activity</div><div className="mt-2 text-sm font-semibold text-[#24543d]">View guidance history</div></button></div></section>
        )}

        {screen === "disclosure" && <section className="min-h-screen px-5 py-5"><button onClick={goBack} className="flex h-10 w-10 items-center justify-center rounded-full border border-[#d3dbd4] bg-white"><span className="h-5 w-5"><ArrowLeftIcon/></span></button><div className="mt-16"><div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#e9efe8] text-[#24543d]"><span className="h-7 w-7"><InfoIcon/></span></div><p className="mt-8 text-sm font-semibold uppercase tracking-[0.14em] text-[#b26a27]">Prototype disclosure</p><h1 className="mt-2 text-3xl font-bold leading-tight">A recommendation,<br/>not a guarantee.</h1><p className="mt-4 text-sm leading-6 text-[#667169]">This prototype uses synthetic procurement data to demonstrate how intelligent centre recommendations can work.</p><div className="mt-7 space-y-3">{["Waiting time is predicted by the prototype ML model.","Centre ranking uses fixed, explainable criteria.","Demo centre locations are synthetic."].map(text => <div key={text} className="flex gap-3 rounded-2xl border border-[#d8dfd9] bg-white p-4"><span className="mt-0.5 h-5 w-5 shrink-0 text-[#24543d]"><CheckIcon/></span><p className="text-sm leading-5 text-[#526057]">{text}</p></div>)}</div><button onClick={() => setScreen("crop")} className="mt-7 h-14 w-full rounded-2xl bg-[#1f513a] text-base font-semibold text-white">Continue</button></div></section>}

        {screen === "crop" && <section className="min-h-screen px-5 py-5"><button onClick={goBack} className="flex h-10 w-10 items-center justify-center rounded-full border border-[#d3dbd4] bg-white"><span className="h-5 w-5"><ArrowLeftIcon/></span></button><div className="mt-10"><p className="text-sm font-semibold text-[#b26a27]">Step 1 of 3</p><h1 className="mt-2 text-3xl font-bold tracking-tight">What crop are you<br/>bringing?</h1><p className="mt-3 text-sm text-[#667169]">Select the crop you want to procure.</p><div className="mt-7 grid grid-cols-2 gap-3">{crops.map(item => <button key={item.id} onClick={() => setCrop(item.id)} className={`overflow-hidden rounded-[22px] border text-left ${crop === item.id ? "border-[#24543d] ring-2 ring-[#24543d]/15" : "border-[#d6ddd7]"} bg-white`}><img src={item.image} alt={item.name} className="h-28 w-full object-cover"/><div className="p-3.5"><div className="text-base font-bold">{language === "hi" ? item.hindi : item.name}</div><div className="mt-1 text-xs text-[#7b867e]">{language === "hi" ? item.name : item.hindi}</div></div></button>)}</div><button disabled={!crop} onClick={() => setScreen("quantity")} className="mt-6 flex h-14 w-full items-center justify-center gap-3 rounded-2xl bg-[#1f513a] text-base font-semibold text-white disabled:opacity-40">Continue<span className="h-5 w-5"><ArrowRightIcon/></span></button></div></section>}

        {screen === "quantity" && <section className="min-h-screen px-5 py-5"><button onClick={goBack} className="flex h-10 w-10 items-center justify-center rounded-full border border-[#d3dbd4] bg-white"><span className="h-5 w-5"><ArrowLeftIcon/></span></button><div className="mt-12"><p className="text-sm font-semibold text-[#b26a27]">Step 2 of 3</p><h1 className="mt-2 text-3xl font-bold tracking-tight">How much crop<br/>are you bringing?</h1><p className="mt-3 text-sm text-[#667169]">Enter the approximate quantity in quintals.</p><div className="mt-12 flex items-center justify-between rounded-[28px] border border-[#d4ddd5] bg-white p-4"><button onClick={decrementQuantity} disabled={Number(quantity) <= 5} className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#edf2ed] text-[#24543d] disabled:opacity-40"><span className="h-6 w-6"><MinusIcon/></span></button><div className="text-center"><input value={quantity} onChange={e => handleQuantityChange(e.target.value)} inputMode="numeric" className="w-28 bg-transparent text-center text-5xl font-bold tracking-tight outline-none"/><div className="mt-1 text-sm font-medium text-[#7b867e]">quintals</div></div><button onClick={incrementQuantity} disabled={Number(quantity) >= 1000} className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#edf2ed] text-[#24543d] disabled:opacity-40"><span className="h-6 w-6"><PlusIcon/></span></button></div><button disabled={!quantity || Number(quantity) < 5 || Number(quantity) > 1000} onClick={() => setScreen("location")} className="mt-8 flex h-14 w-full items-center justify-center gap-3 rounded-2xl bg-[#1f513a] text-base font-semibold text-white disabled:opacity-40">Continue<span className="h-5 w-5"><ArrowRightIcon/></span></button></div></section>}

        {screen === "location" && <section className="min-h-screen px-5 py-5"><button onClick={goBack} className="flex h-10 w-10 items-center justify-center rounded-full border border-[#d3dbd4] bg-white"><span className="h-5 w-5"><ArrowLeftIcon/></span></button><div className="mt-10"><p className="text-sm font-semibold text-[#b26a27]">Step 3 of 3</p><h1 className="mt-2 text-3xl font-bold tracking-tight">Where are you<br/>bringing your crop?</h1><p className="mt-3 text-sm leading-6 text-[#667169]">Use your current location for distance-aware recommendations, or enter your location manually.</p><div className="mt-7 grid grid-cols-2 gap-2 rounded-2xl bg-[#e9eee9] p-1"><button onClick={() => { setLocationMode("gps"); setError(""); }} className={`rounded-xl py-3 text-sm font-semibold ${locationMode === "gps" ? "bg-white text-[#24543d] shadow-sm" : "text-[#68746c]"}`}>Current Location</button><button onClick={() => { setLocationMode("manual"); setGpsLatitude(null); setGpsLongitude(null); setError(""); }} className={`rounded-xl py-3 text-sm font-semibold ${locationMode === "manual" ? "bg-white text-[#24543d] shadow-sm" : "text-[#68746c]"}`}>Enter Manually</button></div>{locationMode === "gps" ? <div className="mt-6 rounded-[24px] border border-[#d4ddd5] bg-white p-5"><div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#e8f0e9] text-[#24543d]"><span className="h-7 w-7"><LocationIcon/></span></div><h2 className="mt-5 text-lg font-bold">Use your current location</h2><p className="mt-2 text-sm leading-5 text-[#68746c]">GPS allows ProcureSmart to calculate approximate distance to each demo centre.</p><button onClick={useCurrentLocation} disabled={gpsLoading} className="mt-5 flex h-13 w-full items-center justify-center gap-2 rounded-2xl border border-[#bfcfc2] bg-[#f7faf7] text-sm font-semibold text-[#24543d] disabled:opacity-50"><span className="h-5 w-5"><LocationIcon/></span>{gpsLoading ? "Getting location..." : gpsLatitude !== null ? "Location captured" : "Use Current Location"}</button></div> : <div className="mt-6 space-y-3">{[["state","State"],["district","District"],["tehsil","Tehsil"],["village","Village"]].map(([key,label]) => <div key={key}><label className="text-xs font-semibold text-[#526057]">{label}</label><input value={manualLocation[key as keyof typeof manualLocation]} onChange={e => setManualLocation({...manualLocation,[key]:e.target.value})} placeholder={`Enter ${label.toLowerCase()}`} className="mt-1 h-13 w-full rounded-2xl border border-[#d0d9d1] bg-white px-4 text-sm outline-none"/></div>)}</div>}{error && <div className="mt-4 rounded-2xl border border-[#ead0c8] bg-[#fff7f4] p-4 text-sm text-[#9a4d36]">{error}</div>}<button onClick={continueFromLocation} className="mt-7 flex h-14 w-full items-center justify-center gap-3 rounded-2xl bg-[#1f513a] text-base font-semibold text-white">Find Best Centre<span className="h-5 w-5"><ArrowRightIcon/></span></button></div></section>}

        {screen === "prediction" && <section className="flex min-h-screen flex-col items-center justify-center px-7 text-center"><div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-[#e6eee7]"><div className="h-12 w-12 animate-pulse rounded-full bg-[#24543d]"/></div><p className="mt-9 text-sm font-semibold uppercase tracking-[0.14em] text-[#b26a27]">ProcureSmart</p><h1 className="mt-3 text-3xl font-bold tracking-tight">Finding the best<br/>option for you</h1><p className="mt-4 max-w-[310px] text-sm leading-6 text-[#69746d]">{loadingMessage}</p><div className="mt-8 flex items-center gap-2 text-xs text-[#7d887f]"><span className="h-4 w-4"><ClockIcon/></span>Predicting waiting time and ranking centres</div></section>}

        {screen === "recommendation" && centre && <section className="min-h-screen px-5 pb-8 pt-5"><button onClick={goBack} className="flex h-10 w-10 items-center justify-center rounded-full border border-[#d3dbd4] bg-white"><span className="h-5 w-5"><ArrowLeftIcon/></span></button><div className="mt-8"><p className="text-sm font-semibold uppercase tracking-[0.14em] text-[#b26a27]">Recommended for you</p><h1 className="mt-2 text-3xl font-bold tracking-tight">Best overall option</h1><div className="mt-6 overflow-hidden rounded-[26px] border border-[#d4ddd5] bg-white"><div className="bg-[#e8efe8] px-5 py-5"><div className="flex items-start justify-between gap-4"><div><div className="text-xs font-semibold uppercase tracking-[0.12em] text-[#617168]">Recommended Centre</div><h2 className="mt-2 text-2xl font-bold">{centre.centre_name}</h2></div><div className="rounded-xl bg-[#1f513a] px-3 py-2 text-center text-white"><div className="text-[10px] uppercase tracking-wide opacity-75">Score</div><div className="text-lg font-bold">{centre.score}</div></div></div></div><div className="grid grid-cols-2 gap-px bg-[#dfe5df]"><div className="bg-white p-4"><div className="text-xs text-[#7a857d]">Predicted wait</div><div className="mt-1 text-lg font-bold">{centre.predicted_waiting_time_minutes} min</div></div><div className="bg-white p-4"><div className="text-xs text-[#7a857d]">Queue</div><div className="mt-1 text-lg font-bold">{centre.queue_length}</div></div><div className="bg-white p-4"><div className="text-xs text-[#7a857d]">Capacity</div><div className="mt-1 text-lg font-bold">{centre.capacity_used_pct}%</div></div><div className="bg-white p-4"><div className="text-xs text-[#7a857d]">Distance</div><div className="mt-1 text-lg font-bold">{locationMode === "gps" && gpsLatitude !== null ? `${centre.distance_km} km` : "—"}</div></div></div><div className="border-t border-[#e0e5e0] px-5 py-5"><div className="flex gap-3"><span className="mt-0.5 h-5 w-5 shrink-0 text-[#24543d]"><CheckIcon/></span><p className="text-sm leading-5 text-[#526057]">{centre.reason}</p></div></div></div><button onClick={() => setScreen("details")} className="mt-5 flex h-14 w-full items-center justify-center gap-3 rounded-2xl bg-[#1f513a] text-base font-semibold text-white">View Centre Details<span className="h-5 w-5"><ArrowRightIcon/></span></button></div></section>}

        {screen === "details" && centre && <section className="min-h-screen px-5 pb-8 pt-5"><button onClick={goBack} className="flex h-10 w-10 items-center justify-center rounded-full border border-[#d3dbd4] bg-white"><span className="h-5 w-5"><ArrowLeftIcon/></span></button><div className="mt-8"><p className="text-sm font-semibold uppercase tracking-[0.14em] text-[#b26a27]">Centre details & map</p><h1 className="mt-2 text-3xl font-bold tracking-tight">{centre.centre_name}</h1><div className="mt-6"><ProcurementMap recommendedCentre={centre} alternatives={recommendation?.alternatives ?? []} farmerLatitude={locationMode === "gps" ? gpsLatitude : null} farmerLongitude={locationMode === "gps" ? gpsLongitude : null}/></div><div className="mt-5 rounded-[24px] border border-[#d5ddd6] bg-white p-5"><div className="text-xs font-semibold uppercase tracking-[0.12em] text-[#7a857d]">Centre snapshot</div><div className="mt-3 grid grid-cols-2 gap-4 text-sm"><div><div className="text-xs text-[#7a857d]">Waiting</div><div className="font-bold">{centre.predicted_waiting_time_minutes} min</div></div><div><div className="text-xs text-[#7a857d]">Queue</div><div className="font-bold">{centre.queue_length}</div></div><div><div className="text-xs text-[#7a857d]">Capacity</div><div className="font-bold">{centre.capacity_used_pct}%</div></div><div><div className="text-xs text-[#7a857d]">Distance</div><div className="font-bold">{centre.distance_km ?? "—"} km</div></div></div></div><button disabled={bookingLoading} onClick={openBooking} className="mt-5 flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-[#1f513a] text-base font-semibold text-white disabled:opacity-50">{bookingLoading ? "Loading slots..." : "Choose Procurement Slot"}<span className="h-5 w-5"><ArrowRightIcon/></span></button></div></section>}

        {screen === "booking" && centre && <section className="min-h-screen px-5 pb-8 pt-5"><button onClick={goBack} className="flex h-10 w-10 items-center justify-center rounded-full border border-[#d3dbd4] bg-white"><span className="h-5 w-5"><ArrowLeftIcon/></span></button><div className="mt-8"><p className="text-sm font-semibold uppercase tracking-[0.14em] text-[#b26a27]">Step 4 · Slot</p><h1 className="mt-2 text-3xl font-bold tracking-tight">Choose your<br/>procurement time.</h1><p className="mt-3 text-sm leading-6 text-[#667169]">Select an available slot. The token is generated only after this booking is confirmed.</p><div className="mt-7 space-y-3">{slots.map(slot => <button key={slot.slot_id} disabled={slot.remaining <= 0} onClick={() => setSelectedSlot(slot)} className={`w-full rounded-2xl border p-4 text-left ${selectedSlot?.slot_id === slot.slot_id ? "border-[#24543d] bg-[#e9f0e9] ring-2 ring-[#24543d]/10" : "border-[#d5ddd6] bg-white"} disabled:opacity-40`}><div className="flex items-center justify-between"><div><div className="text-base font-bold">{slot.start} – {slot.end}</div><div className="mt-1 text-xs text-[#6d786f]">{slot.remaining} places remaining</div></div>{slot.recommended && <span className="rounded-full bg-[#1f513a] px-2.5 py-1 text-[10px] font-bold text-white">Recommended</span>}</div></button>)}</div>{slots.length === 0 && <div className="mt-6 rounded-2xl bg-[#fff7f4] p-4 text-sm text-[#9a4d36]">No slots are currently available for this centre.</div>}<button disabled={!selectedSlot || bookingLoading} onClick={confirmBooking} className="mt-7 h-14 w-full rounded-2xl bg-[#1f513a] text-base font-semibold text-white disabled:opacity-40">{bookingLoading ? "Confirming booking..." : "Confirm & Generate Token"}</button></div></section>}

        {screen === "token" && booking && <section className="min-h-screen px-5 pb-8 pt-5"><button onClick={() => setScreen("dashboard")} className="flex h-10 w-10 items-center justify-center rounded-full border border-[#d3dbd4] bg-white"><span className="h-5 w-5"><ArrowLeftIcon/></span></button><div className="mt-10 text-center"><div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#e4f0e6] text-[#24543d]"><span className="h-8 w-8"><CheckIcon/></span></div><p className="mt-6 text-sm font-semibold uppercase tracking-[0.16em] text-[#b26a27]">Booking confirmed</p><h1 className="mt-2 text-3xl font-bold tracking-tight">Your procurement token</h1><div className="mt-7 rounded-[28px] border border-[#b9cdbd] bg-[#e8f0e9] p-6"><div className="text-xs font-semibold uppercase tracking-[0.14em] text-[#5c7663]">Token number</div><div className="mt-2 text-5xl font-black tracking-[0.08em] text-[#18352a]">{booking.token}</div><div className="mt-5 grid grid-cols-2 gap-4 text-left text-sm"><div><div className="text-xs text-[#728077]">Centre</div><div className="mt-1 font-bold">{booking.centre_id}</div></div><div><div className="text-xs text-[#728077]">Status</div><div className="mt-1 font-bold">{booking.booking_status}</div></div><div><div className="text-xs text-[#728077]">Date</div><div className="mt-1 font-bold">{booking.slot_date}</div></div><div><div className="text-xs text-[#728077]">Slot</div><div className="mt-1 font-bold">{booking.slot_start?.slice(0,5)} – {booking.slot_end?.slice(0,5)}</div></div><div><div className="text-xs text-[#728077]">Crop</div><div className="mt-1 font-bold">{booking.crop}</div></div><div><div className="text-xs text-[#728077]">Quantity</div><div className="mt-1 font-bold">{booking.quantity_quintals} qtl</div></div></div></div><div className="mt-5 rounded-2xl border border-[#d5ddd6] bg-white p-4 text-left text-sm leading-6 text-[#5d6961]">Keep this token for your procurement visit. The operator can update its status from <b>Booked</b> through procurement and payment.</div><button onClick={() => { refreshBooking(); setScreen("dashboard"); }} className="mt-6 h-14 w-full rounded-2xl bg-[#1f513a] text-base font-semibold text-white">Done · Back to Farmer Dashboard</button></div></section>}

        {screen === "best-time" && centre && <section className="min-h-screen px-5 pb-8 pt-5"><button onClick={goBack} className="flex h-10 w-10 items-center justify-center rounded-full border border-[#d3dbd4] bg-white"><span className="h-5 w-5"><ArrowLeftIcon/></span></button><div className="mt-10"><p className="text-sm font-semibold uppercase tracking-[0.14em] text-[#b26a27]">Best-time guidance</p><h1 className="mt-2 text-3xl font-bold tracking-tight">Plan your visit<br/>around the queue.</h1><div className="mt-7 rounded-[26px] border border-[#d5ddd6] bg-white p-5"><div className="flex items-center gap-3"><div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#e7efe8] text-[#24543d]"><span className="h-6 w-6"><ClockIcon/></span></div><div><div className="text-xs text-[#7a857d]">Current predicted wait</div><div className="text-xl font-bold">{centre.predicted_waiting_time_minutes} minutes</div></div></div><div className="mt-6 border-t border-[#e3e8e3] pt-5"><p className="text-sm leading-6 text-[#5b675f]">For the prototype, this guidance uses the same procurement signals used by the recommendation engine.</p></div></div><button onClick={openBooking} className="mt-6 h-14 w-full rounded-2xl bg-[#1f513a] text-base font-semibold text-white">Book a Procurement Slot</button><button onClick={resetFlow} className="mt-3 h-14 w-full rounded-2xl border border-[#cbd7cd] bg-white text-sm font-semibold text-[#24543d]">Skip for now</button></div></section>}

        {screen === "no-centre" && <section className="flex min-h-screen flex-col justify-center px-6"><div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#fff0e7] text-[#a75b2a]"><span className="h-8 w-8"><InfoIcon/></span></div><h1 className="mt-7 text-3xl font-bold tracking-tight">No centre found</h1><p className="mt-3 text-sm leading-6 text-[#68746c]">We could not find a suitable procurement centre for the selected conditions.</p><button onClick={() => setScreen("location")} className="mt-8 h-14 w-full rounded-2xl bg-[#1f513a] text-base font-semibold text-white">Change Location</button><button onClick={() => setScreen("dashboard")} className="mt-3 h-14 w-full rounded-2xl border border-[#cbd7cd] bg-white text-sm font-semibold text-[#24543d]">Back to Home</button></section>}

        {screen === "error" && <section className="flex min-h-screen flex-col justify-center px-6"><div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#fff0eb] text-[#a6533c]"><span className="h-8 w-8"><InfoIcon/></span></div><p className="mt-7 text-sm font-semibold uppercase tracking-[0.14em] text-[#b26a27]">Something went wrong</p><h1 className="mt-2 text-3xl font-bold tracking-tight">We couldn't complete that.</h1><p className="mt-4 text-sm leading-6 text-[#68746c]">{error || "Please try again."}</p><button onClick={() => { setError(""); setScreen("dashboard"); }} className="mt-8 h-14 w-full rounded-2xl bg-[#1f513a] text-base font-semibold text-white">Back to Home</button><button onClick={() => { setError(""); setScreen("location"); }} className="mt-3 h-14 w-full rounded-2xl border border-[#cbd7cd] bg-white text-sm font-semibold text-[#24543d]">Try Again</button></section>}

        {screen === "activity" && <section className="min-h-screen px-5 pb-8 pt-5"><button onClick={goBack} className="flex h-10 w-10 items-center justify-center rounded-full border border-[#d3dbd4] bg-white"><span className="h-5 w-5"><ArrowLeftIcon/></span></button><div className="mt-10"><p className="text-sm font-semibold uppercase tracking-[0.14em] text-[#b26a27]">Activity</p><h1 className="mt-2 text-3xl font-bold tracking-tight">Your procurement<br/>activity</h1>{booking ? <div className="mt-7 rounded-[24px] border border-[#d5ddd6] bg-white p-5"><div className="text-xs font-semibold uppercase tracking-[0.12em] text-[#7a857d]">Latest booking</div><div className="mt-3 text-3xl font-black tracking-wide text-[#24543d]">{booking.token}</div><div className="mt-2 text-sm text-[#68746c]">{booking.centre_id} · {booking.crop} · {booking.booking_status}</div><button onClick={() => setScreen("token")} className="mt-5 h-12 w-full rounded-xl bg-[#1f513a] text-sm font-semibold text-white">View booking</button></div> : <div className="mt-7 rounded-[24px] border border-[#d5ddd6] bg-white p-5"><h2 className="text-lg font-bold">No procurement booking yet</h2><p className="mt-2 text-sm leading-6 text-[#68746c]">Your confirmed token and procurement status will appear here after you book a slot.</p></div>}<button onClick={() => setScreen("disclosure")} className="mt-6 flex h-14 w-full items-center justify-center gap-3 rounded-2xl bg-[#1f513a] text-base font-semibold text-white">Start New Guidance<span className="h-5 w-5"><ArrowRightIcon/></span></button></div></section>}
      </div>
    </main>
  );
}
