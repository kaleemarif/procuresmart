"use client";

import { useState } from "react";
import { recommendCentres } from "../../lib/api";

type Screen =
  | "dashboard"
  | "disclosure"
  | "crop"
  | "quantity"
  | "location"
  | "prediction"
  | "recommendation"
  | "details"
  | "best-time"
  | "activity"
  | "no-centre"
  | "error";

export default function FarmerPage() {
  const [screen, setScreen] = useState<Screen>("dashboard");
  const [language, setLanguage] = useState<"EN" | "HI">("EN");

  const [location, setLocation] = useState("");
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);

  const [crop, setCrop] = useState("");
  const [quantity, setQuantity] = useState(50);

  const [recommendation, setRecommendation] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [stateName, setStateName] = useState("");
  const [district, setDistrict] = useState("");
  const [tehsil, setTehsil] = useState("");

  const crops = ["Wheat", "Soybean", "Rice", "Gram", "Maize"];

  const hindi = language === "HI";

  const text = {
    dashboard: hindi ? "डैशबोर्ड" : "Dashboard",
    goodMorning: hindi ? "नमस्ते किसान 👋" : "Good morning, Farmer 👋",
    heroTitle: hindi
      ? "सही केंद्र और सही समय चुनें।"
      : "Choose the right centre and the right time.",
    heroDescription: hindi
      ? "Waiting time, distance, queue और centre capacity के आधार पर स्मार्ट recommendation प्राप्त करें।"
      : "Get an intelligent recommendation based on waiting time, distance, queue and centre capacity.",
    findCentre: hindi
      ? "सही खरीद केंद्र खोजें"
      : "Find Best Procurement Centre",
    marketPrices: hindi ? "आज के मंडी भाव" : "Today's Market Prices",
    pending: hindi
      ? "डेटा इंटीग्रेशन लंबित है"
      : "Data integration is pending",
    activity: hindi ? "मेरी गतिविधि" : "My Activity",
    noActivity: hindi ? "अभी कोई गतिविधि नहीं है" : "No activity yet",
    disclosure: hindi ? "प्रोटोटाइप मोड" : "Prototype Mode",
    cropTitle: hindi
      ? "आप कौन-सी फसल बेच रहे हैं?"
      : "What crop are you selling?",
    cropSubtitle: hindi
      ? "Procurement के लिए अपनी फसल चुनें।"
      : "Select the crop you want to take for procurement.",
    quantityTitle: hindi
      ? "आपके पास कितनी उपज है?"
      : "How much produce do you have?",
    quantitySubtitle: hindi
      ? "अपनी अनुमानित मात्रा क्विंटल में दर्ज करें।"
      : "Enter your approximate quantity in quintals.",
    locationTitle: hindi
      ? "आप कहाँ स्थित हैं?"
      : "Where are you located?",
    locationSubtitle: hindi
      ? "अपना current location इस्तेमाल करें या location manually चुनें।"
      : "Use your current location or select your location manually.",
    useLocation: hindi
      ? "मेरा वर्तमान स्थान इस्तेमाल करें"
      : "Use My Current Location",
    manual: hindi ? "स्थान मैन्युअली चुनें" : "Select Manually",
    state: hindi ? "राज्य" : "State",
    district: hindi ? "जिला" : "District",
    tehsil: hindi ? "तहसील / ब्लॉक" : "Tehsil / Block",
    continue: hindi ? "जारी रखें" : "Continue",
    recommended: hindi ? "आपके लिए सुझाव" : "RECOMMENDED FOR YOU",
    bestCentre: hindi
      ? "सबसे अच्छा खरीद केंद्र"
      : "Best Procurement Centre",
    waiting: hindi ? "प्रतीक्षा" : "Waiting",
    distance: hindi ? "दूरी" : "Distance",
    queue: hindi ? "कतार" : "Queue",
    capacity: hindi ? "क्षमता" : "Capacity",
    score: hindi ? "स्कोर" : "Score",
    details: hindi ? "केंद्र की जानकारी" : "View Centre Details",
    bestTime: hindi ? "सही समय की सलाह" : "Best Time Guidance",
    back: hindi ? "वापस" : "Back",
    prediction: hindi
      ? "सबसे अच्छा केंद्र खोज रहे हैं..."
      : "Finding the best centre...",
    noCentre: hindi ? "कोई केंद्र नहीं मिला" : "No Centre Found",
    tryAgain: hindi ? "फिर कोशिश करें" : "Try Again",
    error: hindi ? "कुछ गलत हो गया" : "Something went wrong",
  };

  function Header({
    showBack = false,
    onBack,
  }: {
    showBack?: boolean;
    onBack?: () => void;
  }) {
    return (
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {showBack && (
            <button
              onClick={onBack}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-lg shadow-sm"
            >
              ←
            </button>
          )}

          <div>
            <p className="text-sm font-black text-emerald-700">
              ProcureSmart
            </p>

            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Sahi Jankari, Sahi Samay
            </p>
          </div>
        </div>

        <button
          onClick={() =>
            setLanguage(language === "EN" ? "HI" : "EN")
          }
          className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-bold shadow-sm"
        >
          {hindi ? "English" : "हिन्दी"}
        </button>
      </header>
    );
  }

  function resetFlow() {
    setCrop("");
    setQuantity(50);
    setLocation("");
    setLatitude(null);
    setLongitude(null);
    setStateName("");
    setDistrict("");
    setTehsil("");
    setRecommendation(null);
    setError("");
  }

  function useCurrentLocation() {
    setError("");

    if (!navigator.geolocation) {
      setError("Location is not supported by this browser.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        setLatitude(lat);
        setLongitude(lng);
        setLocation(`${lat.toFixed(6)}, ${lng.toFixed(6)}`);

        setScreen("crop");
      },
      () => {
        setError(
          hindi
            ? "Location access नहीं मिला। आप manually location चुन सकते हैं।"
            : "Unable to access location. You can select your location manually."
        );
      }
    );
  }

  async function getRecommendation() {
    if (!crop || quantity <= 0) {
      setError(
        hindi
          ? "कृपया crop और valid quantity चुनें।"
          : "Please select a crop and enter a valid quantity."
      );

      setScreen("error");
      return;
    }

    setLoading(true);
    setError("");
    setScreen("prediction");

    try {
      const now = new Date();

      const result = await recommendCentres({
        crop,
        quantity_quintals: Number(quantity),
        hour: now.getHours(),
        day_of_week: now.getDay(),
        weather: "Clear",
        farmer_latitude: latitude ?? undefined,
        farmer_longitude: longitude ?? undefined,
      });

      if (!result?.recommended_centre) {
        setScreen("no-centre");
        return;
      }

      setRecommendation(result);
      setScreen("recommendation");
    } catch {
      setError(
        hindi
          ? "Recommendation प्राप्त नहीं हो सकी। कृपया फिर कोशिश करें।"
          : "Unable to get recommendation. Please try again."
      );

      setScreen("error");
    } finally {
      setLoading(false);
    }
  }

  /* =========================
     DASHBOARD
  ========================= */

  if (screen === "dashboard") {
    return (
      <main className="min-h-screen bg-[#f7f8f3] text-slate-900">
        <div className="mx-auto max-w-5xl px-5 py-6">
          <Header />

          <section className="mt-8 overflow-hidden rounded-[2rem] bg-emerald-700 text-white shadow-xl">
            <div className="grid md:grid-cols-2">
              <div className="p-7 sm:p-9">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-100">
                  {hindi ? "किसान डैशबोर्ड" : "Farmer Dashboard"}
                </p>

                <h1 className="mt-3 text-3xl font-black leading-tight sm:text-4xl">
                  {text.heroTitle}
                </h1>

                <p className="mt-4 text-sm leading-6 text-emerald-50">
                  {text.heroDescription}
                </p>

                <button
                  onClick={() => setScreen("disclosure")}
                  className="mt-7 rounded-2xl bg-white px-6 py-4 text-sm font-black text-emerald-800 shadow-lg"
                >
                  {text.findCentre} →
                </button>
              </div>

              <div className="hidden min-h-[300px] items-center justify-center bg-emerald-800/40 md:flex">
                <div className="text-center">
                  <div className="text-8xl">👨‍🌾</div>
                  <div className="mt-2 text-6xl">🌾</div>
                </div>
              </div>
            </div>
          </section>

          <section className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="rounded-3xl border border-slate-200 bg-white p-6">
              <p className="text-xs font-black uppercase tracking-wider text-slate-400">
                {text.marketPrices}
              </p>

              <h2 className="mt-3 text-xl font-black">
                {text.pending}
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                {hindi
                  ? "Live market-price integration भविष्य के version में जोड़ा जाएगा।"
                  : "Live market-price integration will be connected in a future version."}
              </p>
            </div>

            <button
              onClick={() => setScreen("activity")}
              className="rounded-3xl border border-slate-200 bg-white p-6 text-left transition hover:bg-slate-50"
            >
              <p className="text-xs font-black uppercase tracking-wider text-slate-400">
                {text.activity}
              </p>

              <h2 className="mt-3 text-xl font-black">
                {text.noActivity}
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                {hindi
                  ? "आपकी procurement history यहाँ दिखाई देगी।"
                  : "Your procurement history will appear here."}
              </p>
            </button>
          </section>
        </div>
      </main>
    );
  }

  /* =========================
     F-10 DISCLOSURE
  ========================= */

  if (screen === "disclosure") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7f8f3] px-5 py-8">
        <div className="w-full max-w-xl rounded-[2rem] border border-amber-200 bg-white p-7 shadow-xl sm:p-8">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 text-2xl">
            ℹ️
          </div>

          <p className="mt-7 text-xs font-black uppercase tracking-[0.18em] text-amber-700">
            F-10 • PROTOTYPE DISCLOSURE
          </p>

          <h1 className="mt-3 text-3xl font-black">
            {text.disclosure}
          </h1>

          <p className="mt-4 text-sm leading-7 text-slate-600">
            {hindi
              ? "यह prototype synthetic training data और demo procurement-centre information का उपयोग करता है। इसका उद्देश्य recommendation workflow को demonstrate करना है।"
              : "This prototype uses synthetic training data and demo procurement-centre information. It is intended to demonstrate the recommendation workflow."}
          </p>

          <div className="mt-6 grid gap-3">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                DATA
              </p>

              <p className="mt-1 text-sm font-bold">
                Synthetic prototype dataset
              </p>
            </div>

            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                CENTRES
              </p>

              <p className="mt-1 text-sm font-bold">
                Demo centre information
              </p>
            </div>
          </div>

          <button
            onClick={() => setScreen("crop")}
            className="mt-7 w-full rounded-2xl bg-emerald-700 px-5 py-4 text-sm font-black text-white"
          >
            {hindi ? "समझ गया, आगे बढ़ें" : "I Understand, Continue"} →
          </button>
        </div>
      </main>
    );
  }

  /* =========================
     F-02 CROP
  ========================= */

  if (screen === "crop") {
    return (
      <main className="min-h-screen bg-[#f7f8f3] px-5 py-7">
        <div className="mx-auto max-w-xl">
          <Header
            showBack
            onBack={() => setScreen("disclosure")}
          />

          <div className="mt-9">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700">
              F-02 • STEP 1 OF 3
            </p>

            <h1 className="mt-3 text-3xl font-black">
              {text.cropTitle}
            </h1>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              {text.cropSubtitle}
            </p>

            <div className="mt-8 grid grid-cols-2 gap-3">
              {crops.map((item) => {
                const selected = crop === item;

                return (
                  <button
                    key={item}
                    onClick={() => setCrop(item)}
                    className={`rounded-3xl border p-5 text-left transition ${
                      selected
                        ? "border-emerald-600 bg-emerald-50 text-emerald-800 shadow-sm"
                        : "border-slate-200 bg-white hover:bg-slate-50"
                    }`}
                  >
                    <div className="text-3xl">🌾</div>

                    <p className="mt-3 text-sm font-black">
                      {item}
                    </p>

                    {selected && (
                      <p className="mt-1 text-xs font-bold text-emerald-700">
                        ✓ Selected
                      </p>
                    )}
                  </button>
                );
              })}
            </div>

            <button
              disabled={!crop}
              onClick={() => setScreen("quantity")}
              className="mt-7 w-full rounded-2xl bg-emerald-700 px-5 py-4 text-sm font-black text-white disabled:opacity-40"
            >
              {text.continue} →
            </button>
          </div>
        </div>
      </main>
    );
  }

  /* =========================
     QUANTITY
  ========================= */

  if (screen === "quantity") {
    return (
      <main className="min-h-screen bg-[#f7f8f3] px-5 py-7">
        <div className="mx-auto max-w-xl">
          <Header
            showBack
            onBack={() => setScreen("crop")}
          />

          <div className="mt-9">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700">
              F-02 • STEP 2 OF 3
            </p>

            <h1 className="mt-3 text-3xl font-black">
              {text.quantityTitle}
            </h1>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              {text.quantitySubtitle}
            </p>

            <section className="mt-8 rounded-[2rem] border border-slate-200 bg-white p-7 text-center shadow-sm">
              <p className="text-sm font-bold text-slate-500">
                {crop}
              </p>

              <div className="mt-8 flex items-center justify-center gap-5">
                <button
                  onClick={() =>
                    setQuantity((value) => Math.max(1, value - 5))
                  }
                  className="flex h-14 w-14 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-2xl font-black"
                >
                  −
                </button>

                <div className="min-w-[145px]">
                  <p className="text-6xl font-black text-emerald-700">
                    {quantity}
                  </p>

                  <p className="mt-1 text-sm font-bold text-slate-400">
                    quintals
                  </p>
                </div>

                <button
                  onClick={() =>
                    setQuantity((value) => value + 5)
                  }
                  className="flex h-14 w-14 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-2xl font-black"
                >
                  +
                </button>
              </div>

              <input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) =>
                  setQuantity(
                    Math.max(1, Number(e.target.value) || 1)
                  )
                }
                className="mt-8 w-full rounded-2xl border border-slate-200 px-5 py-4 text-center text-lg font-black outline-none focus:border-emerald-500"
              />
            </section>

            <button
              onClick={() => setScreen("location")}
              className="mt-7 w-full rounded-2xl bg-emerald-700 px-5 py-4 text-sm font-black text-white"
            >
              {text.continue} →
            </button>
          </div>
        </div>
      </main>
    );
  }

  /* =========================
     F-03 LOCATION
  ========================= */

  if (screen === "location") {
    return (
      <main className="min-h-screen bg-[#f7f8f3] px-5 py-7">
        <div className="mx-auto max-w-xl">
          <Header
            showBack
            onBack={() => setScreen("quantity")}
          />

          <div className="mt-9">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700">
              F-03 • STEP 3 OF 3
            </p>

            <h1 className="mt-3 text-3xl font-black">
              {text.locationTitle}
            </h1>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              {text.locationSubtitle}
            </p>

            {/* GPS */}
            <button
              onClick={useCurrentLocation}
              className="mt-8 flex w-full items-center gap-4 rounded-3xl border border-emerald-200 bg-emerald-50 p-5 text-left transition hover:bg-emerald-100"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-700 text-xl text-white">
                📍
              </div>

              <div>
                <p className="text-sm font-black text-emerald-900">
                  {text.useLocation}
                </p>

                <p className="mt-1 text-xs text-emerald-700">
                  {latitude
                    ? `${latitude.toFixed(4)}, ${longitude?.toFixed(4)}`
                    : hindi
                    ? "GPS से दूरी calculate की जाएगी"
                    : "GPS will be used for distance calculation"}
                </p>
              </div>
            </button>

            <div className="my-7 flex items-center gap-3">
              <div className="h-px flex-1 bg-slate-200" />
              <span className="text-[10px] font-black text-slate-400">
                OR
              </span>
              <div className="h-px flex-1 bg-slate-200" />
            </div>

            {/* Manual location */}
            <section className="rounded-3xl border border-slate-200 bg-white p-5">
              <p className="text-sm font-black">
                {text.manual}
              </p>

              <select
                value={stateName}
                onChange={(e) => setStateName(e.target.value)}
                className="mt-4 w-full rounded-2xl border border-slate-200 bg-white px-4 py-4 text-sm outline-none"
              >
                <option value="">{text.state}</option>
                <option value="Madhya Pradesh">
                  Madhya Pradesh
                </option>
              </select>

              <input
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                placeholder={text.district}
                className="mt-3 w-full rounded-2xl border border-slate-200 px-4 py-4 text-sm outline-none"
              />

              <input
                value={tehsil}
                onChange={(e) => setTehsil(e.target.value)}
                placeholder={text.tehsil}
                className="mt-3 w-full rounded-2xl border border-slate-200 px-4 py-4 text-sm outline-none"
              />

              <input
                value={location}
                onChange={(e) => {
                  setLocation(e.target.value);
                  setLatitude(null);
                  setLongitude(null);
                }}
                placeholder={
                  hindi
                    ? "गाँव / शहर / स्थान"
                    : "Village / Town / Locality"
                }
                className="mt-3 w-full rounded-2xl border border-slate-200 px-4 py-4 text-sm outline-none"
              />
            </section>

            <button
              onClick={getRecommendation}
              disabled={loading}
              className="mt-7 w-full rounded-2xl bg-emerald-700 px-5 py-4 text-sm font-black text-white disabled:opacity-50"
            >
              {text.continue} →
            </button>

            {error && (
              <p className="mt-4 rounded-2xl bg-red-50 p-4 text-sm font-semibold text-red-600">
                {error}
              </p>
            )}
          </div>
        </div>
      </main>
    );
  }

  /* =========================
     F-04 PREDICTION
  ========================= */

  if (screen === "prediction") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7f8f3] px-5">
        <div className="w-full max-w-md text-center">
          <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-emerald-100">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-emerald-200 border-t-emerald-700" />
          </div>

          <p className="mt-8 text-xs font-black uppercase tracking-[0.2em] text-emerald-700">
            F-04 • PREDICTION
          </p>

          <h1 className="mt-3 text-3xl font-black">
            {text.prediction}
          </h1>

          <p className="mt-4 text-sm leading-6 text-slate-500">
            {hindi
              ? "Waiting time, queue, centre capacity और distance का analysis हो रहा है।"
              : "Analysing waiting time, queue, centre capacity and distance."}
          </p>

          <div className="mt-8 space-y-3 text-left">
            {[
              "Waiting time",
              "Distance",
              "Queue",
              "Capacity",
            ].map((item) => (
              <div
                key={item}
                className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4"
              >
                <span className="font-black text-emerald-700">
                  ✓
                </span>

                <span className="text-sm font-semibold text-slate-600">
                  {item}
                </span>
              </div>
            ))}
          </div>
        </div>
      </main>
    );
  }

  /* =========================
     F-05 RECOMMENDATION
  ========================= */

  if (screen === "recommendation") {
    const centre = recommendation?.recommended_centre;

    return (
      <main className="min-h-screen bg-[#f7f8f3] px-5 py-7">
        <div className="mx-auto max-w-2xl">
          <Header
            showBack
            onBack={() => setScreen("crop")}
          />

          <div className="mt-9">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700">
              F-05 • {text.recommended}
            </p>

            <h1 className="mt-3 text-3xl font-black">
              {text.bestCentre}
            </h1>

            {centre && (
              <section className="mt-7 overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
                <div className="bg-emerald-50 p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-black uppercase tracking-wider text-emerald-700">
                        Rank #1
                      </p>

                      <h2 className="mt-2 text-2xl font-black">
                        {centre.centre_name}
                      </h2>
                    </div>

                    <div className="rounded-2xl bg-white px-4 py-3 text-center shadow-sm">
                      <p className="text-[10px] font-black uppercase text-slate-400">
                        {text.score}
                      </p>

                      <p className="mt-1 text-xl font-black text-emerald-700">
                        {centre.score}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 p-6 md:grid-cols-4">
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-xs font-bold text-slate-400">
                      {text.waiting}
                    </p>

                    <p className="mt-1 font-black">
                      {centre.predicted_waiting_time_minutes} min
                    </p>
                  </div>

                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-xs font-bold text-slate-400">
                      {text.distance}
                    </p>

                    <p className="mt-1 font-black">
                      {centre.distance_km} km
                    </p>
                  </div>

                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-xs font-bold text-slate-400">
                      {text.queue}
                    </p>

                    <p className="mt-1 font-black">
                      {centre.queue_length}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-xs font-bold text-slate-400">
                      {text.capacity}
                    </p>

                    <p className="mt-1 font-black">
                      {centre.capacity_used_pct}%
                    </p>
                  </div>
                </div>

                <div className="px-6">
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-sm leading-6 text-slate-600">
                      {centre.reason}
                    </p>
                  </div>
                </div>

                <div className="grid gap-3 p-6 md:grid-cols-2">
                  <button
                    onClick={() => setScreen("details")}
                    className="rounded-2xl bg-emerald-700 px-5 py-4 text-sm font-black text-white"
                  >
                    {text.details} →
                  </button>

                  <button
                    onClick={() => setScreen("best-time")}
                    className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-black text-emerald-800"
                  >
                    {text.bestTime} →
                  </button>
                </div>
              </section>
            )}

            <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4">
              <p className="text-[10px] font-black uppercase tracking-wider text-amber-700">
                Prototype Disclosure
              </p>

              <p className="mt-2 text-xs leading-5 text-amber-800">
                Recommendations currently use synthetic training data
                and demo centre information.
              </p>
            </div>
          </div>
        </div>
      </main>
    );
  }

  /* =========================
     F-06 DETAILS
  ========================= */

  if (screen === "details") {
    const centre = recommendation?.recommended_centre;

    return (
      <main className="min-h-screen bg-[#f7f8f3] px-5 py-7">
        <div className="mx-auto max-w-2xl">
          <Header
            showBack
            onBack={() => setScreen("recommendation")}
          />

          <div className="mt-9">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700">
              F-06 • CENTRE DETAILS & MAP
            </p>

            <h1 className="mt-3 text-3xl font-black">
              {centre?.centre_name || text.bestCentre}
            </h1>

            <section className="mt-7 overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
              <div className="relative flex h-72 items-center justify-center bg-slate-100">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(16,185,129,0.16),transparent_35%),radial-gradient(circle_at_70%_70%,rgba(249,115,22,0.12),transparent_35%)]" />

                <div className="relative text-center">
                  <div className="text-6xl">🗺️</div>

                  <p className="mt-3 font-black">
                    {hindi ? "मैप" : "Map"}
                  </p>

                  <p className="mt-1 text-sm text-slate-500">
                    {hindi
                      ? "Centre location यहाँ दिखाई देगा।"
                      : "Centre location will appear here."}
                  </p>
                </div>
              </div>

              {centre && (
                <div className="p-6">
                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="rounded-2xl bg-slate-50 p-5">
                      <p className="text-xs font-bold text-slate-400">
                        {text.distance}
                      </p>

                      <p className="mt-1 text-xl font-black">
                        {centre.distance_km} km
                      </p>
                    </div>

                    <div className="rounded-2xl bg-slate-50 p-5">
                      <p className="text-xs font-bold text-slate-400">
                        {hindi
                          ? "अनुमानित प्रतीक्षा"
                          : "Predicted Waiting"}
                      </p>

                      <p className="mt-1 text-xl font-black">
                        {centre.predicted_waiting_time_minutes} min
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 rounded-2xl border border-slate-200 p-5">
                    <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                      Centre
                    </p>

                    <p className="mt-2 font-black">
                      {centre.centre_name}
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      {centre.latitude}, {centre.longitude}
                    </p>
                  </div>
                </div>
              )}
            </section>

            <button
              onClick={() => setScreen("best-time")}
              className="mt-5 w-full rounded-2xl bg-emerald-700 px-5 py-4 text-sm font-black text-white"
            >
              {text.bestTime} →
            </button>
          </div>
        </div>
      </main>
    );
  }

  /* =========================
     F-07 BEST TIME
  ========================= */

  if (screen === "best-time") {
    const centre = recommendation?.recommended_centre;

    return (
      <main className="min-h-screen bg-[#f7f8f3] px-5 py-7">
        <div className="mx-auto max-w-xl">
          <Header
            showBack
            onBack={() => setScreen("details")}
          />

          <div className="mt-9">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700">
              F-07 • TIMING GUIDANCE
            </p>

            <h1 className="mt-3 text-3xl font-black">
              {text.bestTime}
            </h1>

            <section className="mt-7 rounded-[2rem] border border-slate-200 bg-white p-7 shadow-sm">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-100 text-3xl">
                🕐
              </div>

              <h2 className="mt-6 text-xl font-black">
                {hindi
                  ? "अपनी यात्रा को बेहतर तरीके से प्लान करें"
                  : "Plan your visit smarter"}
              </h2>

              <p className="mt-3 text-sm leading-7 text-slate-600">
                {hindi
                  ? "Current prediction के आधार पर कम queue वाले समय में centre visit करना बेहतर हो सकता है।"
                  : "Based on the current prediction, consider visiting during a lower-queue period."}
              </p>

              {centre && (
                <div className="mt-6 rounded-2xl bg-emerald-50 p-5">
                  <p className="text-[10px] font-black uppercase tracking-wider text-emerald-700">
                    Current Prediction
                  </p>

                  <p className="mt-2 text-3xl font-black text-emerald-800">
                    {centre.predicted_waiting_time_minutes} min
                  </p>

                  <p className="mt-1 text-xs text-emerald-700">
                    predicted waiting time
                  </p>
                </div>
              )}
            </section>

            <button
              onClick={() => setScreen("dashboard")}
              className="mt-5 w-full rounded-2xl bg-emerald-700 px-5 py-4 text-sm font-black text-white"
            >
              {text.dashboard}
            </button>
          </div>
        </div>
      </main>
    );
  }

  /* =========================
     ACTIVITY
  ========================= */

  if (screen === "activity") {
    return (
      <main className="min-h-screen bg-[#f7f8f3] px-5 py-7">
        <div className="mx-auto max-w-xl">
          <Header
            showBack
            onBack={() => setScreen("dashboard")}
          />

          <div className="mt-9">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700">
              ACTIVITY
            </p>

            <h1 className="mt-3 text-3xl font-black">
              {text.activity}
            </h1>

            <section className="mt-7 rounded-[2rem] border border-slate-200 bg-white p-7 text-center">
              <div className="text-5xl">📋</div>

              <h2 className="mt-5 text-xl font-black">
                {text.noActivity}
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                {hindi
                  ? "आपकी procurement activity यहाँ दिखाई देगी।"
                  : "Your procurement activity will appear here."}
              </p>
            </section>
          </div>
        </div>
      </main>
    );
  }

  /* =========================
     F-09 NO CENTRE
  ========================= */

  if (screen === "no-centre") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7f8f3] px-5">
        <div className="w-full max-w-md text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-orange-100 text-3xl">
            🔎
          </div>

          <p className="mt-8 text-xs font-black uppercase tracking-[0.18em] text-orange-700">
            F-09
          </p>

          <h1 className="mt-3 text-3xl font-black">
            {text.noCentre}
          </h1>

          <p className="mt-4 text-sm leading-6 text-slate-500">
            {hindi
              ? "आपके अनुरोध के लिए उपयुक्त procurement centre नहीं मिला।"
              : "We could not find a suitable procurement centre for your request."}
          </p>

          <button
            onClick={() => {
              resetFlow();
              setScreen("crop");
            }}
            className="mt-7 w-full rounded-2xl bg-emerald-700 px-5 py-4 text-sm font-black text-white"
          >
            {text.tryAgain}
          </button>

          <button
            onClick={() => setScreen("dashboard")}
            className="mt-3 w-full rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm font-bold"
          >
            {text.dashboard}
          </button>
        </div>
      </main>
    );
  }

  /* =========================
     ERROR
  ========================= */

  if (screen === "error") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7f8f3] px-5">
        <div className="w-full max-w-md text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-red-100 text-3xl font-black text-red-600">
            !
          </div>

          <h1 className="mt-8 text-3xl font-black">
            {text.error}
          </h1>

          <p className="mt-4 text-sm leading-6 text-slate-500">
            {error}
          </p>

          <button
            onClick={() => setScreen("location")}
            className="mt-7 w-full rounded-2xl bg-emerald-700 px-5 py-4 text-sm font-black text-white"
          >
            {text.tryAgain}
          </button>

          <button
            onClick={() => setScreen("dashboard")}
            className="mt-3 w-full rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm font-bold"
          >
            {text.dashboard}
          </button>
        </div>
      </main>
    );
  }

  return null;
      }
