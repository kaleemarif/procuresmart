"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { recommendCentres } from "../lib/api";

type Centre = {
  centre_id: string;
  centre_name: string;
  distance_km: number;
  queue_length: number;
  active_counters: number;
  avg_processing_time: number;
  capacity_used_pct: number;
  predicted_waiting_time_minutes: number;
  score: number;
  rank: number;
  reason: string;
};

type RecommendationResult = {
  recommended_centre: Centre;
  alternatives: Centre[];
  weights: {
    waiting_time: number;
    distance: number;
    queue: number;
    capacity: number;
  };
  data_mode: string;
};

type Screen =
  | "dashboard"
  | "location"
  | "crop"
  | "recommendation"
  | "details"
  | "activity";

const crops = ["Wheat", "Soybean", "Rice", "Gram", "Maize"];

export default function FarmerHome() {
  const router = useRouter();

  const [screen, setScreen] = useState<Screen>("dashboard");
  const [hindi, setHindi] = useState(false);

  const [locationEnabled, setLocationEnabled] = useState(false);
  const [locationText, setLocationText] = useState("");
  const [locationLoading, setLocationLoading] = useState(false);

  const [crop, setCrop] = useState("Wheat");
  const [quantity, setQuantity] = useState("50");

  const [recommendation, setRecommendation] =
    useState<RecommendationResult | null>(null);

  const [selectedCentre, setSelectedCentre] = useState<Centre | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [showSahayak, setShowSahayak] = useState(false);

  const t = hindi
    ? {
        farmer: "किसान",
        prototype: "प्रोटोटाइप",
        language: "English",
        greeting: "नमस्ते किसान 👋",
        dashboardTitle: "सही केंद्र और सही समय चुनें।",
        dashboardSub:
          "अपनी फसल के लिए बेहतर खरीद केंद्र खोजें और अपनी यात्रा की योजना बनाएं।",
        find: "सबसे अच्छा खरीद केंद्र खोजें",
        findSub: "स्थान, फसल और मात्रा के आधार पर बेहतर विकल्प पाएं",
        market: "आज के मंडी भाव",
        marketSub: "Market / Mandi Information",
        pending: "डेटा इंटीग्रेशन लंबित है",
        activity: "मेरी गतिविधि",
        activitySub: "आपकी हाल की खरीद गतिविधियां यहां दिखाई देंगी।",
        plan: "अपनी यात्रा की योजना बनाएं",
        back: "वापस",
        continue: "आगे बढ़ें",
        locationTitle: "आप कहाँ से आ रहे हैं?",
        locationSub:
          "नजदीकी खरीद केंद्रों की दूरी की गणना करने के लिए अपना स्थान साझा करें।",
        useLocation: "वर्तमान स्थान का उपयोग करें",
        manual: "स्थान मैन्युअली दर्ज करें",
        locationPlaceholder: "शहर / जिला दर्ज करें",
        locationDetected: "स्थान प्राप्त हो गया ✓",
        cropTitle: "अपनी फसल की जानकारी दें",
        cropSub: "हम आपकी फसल और मात्रा के आधार पर विकल्प खोजेंगे।",
        crop: "फसल",
        quantity: "मात्रा",
        quantityPlaceholder: "मात्रा क्विंटल में",
        findCentre: "सबसे अच्छा केंद्र खोजें",
        finding: "सबसे अच्छा केंद्र खोज रहे हैं...",
        recommended: "अनुशंसित केंद्र",
        wait: "अनुमानित प्रतीक्षा",
        distance: "दूरी",
        queue: "कतार",
        capacity: "क्षमता",
        score: "स्कोर",
        why: "यह केंद्र क्यों?",
        alternatives: "अन्य विकल्प",
        details: "केंद्र की जानकारी",
        map: "मानचित्र",
        mapPending: "Map integration अगले चरण में जोड़ा जाएगा।",
        directions: "दिशा देखें",
        activityTitle: "आपकी गतिविधि",
        activityEmpty: "अभी कोई पिछली गतिविधि उपलब्ध नहीं है।",
        sahayak: "सहायक",
        sahayakTitle: "Sahayak",
        sahayakText: "AI assistant अगले चरण में जोड़ा जाएगा।",
        close: "बंद करें",
        dataNote: "Prototype में operational conditions और predictions synthetic data पर आधारित हैं।",
        invalidQuantity: "कृपया सही मात्रा दर्ज करें।",
        locationRequired: "कृपया अपना स्थान दर्ज करें या current location का उपयोग करें।",
        error: "Recommendation प्राप्त नहीं हो सकी। कृपया दोबारा प्रयास करें।",
      }
    : {
        farmer: "Farmer",
        prototype: "Prototype",
        language: "हिन्दी",
        greeting: "Good morning, Farmer 👋",
        dashboardTitle: "Choose the right centre and the right time.",
        dashboardSub:
          "Find a better procurement centre for your crop and plan your visit.",
        find: "Find Best Procurement Centre",
        findSub: "Get better options based on your location, crop and quantity",
        market: "Today's Market Prices",
        marketSub: "Market / Mandi Information",
        pending: "Data integration is pending",
        activity: "My Activity",
        activitySub: "Your recent procurement activity will appear here.",
        plan: "Plan Your Visit",
        back: "Back",
        continue: "Continue",
        locationTitle: "Where are you coming from?",
        locationSub:
          "Share your location so we can calculate distance to nearby procurement centres.",
        useLocation: "Use Current Location",
        manual: "Enter Location Manually",
        locationPlaceholder: "Enter city / district",
        locationDetected: "Location received ✓",
        cropTitle: "Tell us about your crop",
        cropSub:
          "We'll find suitable options based on your crop and quantity.",
        crop: "Crop",
        quantity: "Quantity",
        quantityPlaceholder: "Quantity in quintals",
        findCentre: "Find Best Centre",
        finding: "Finding best centre...",
        recommended: "Recommended Centre",
        wait: "Estimated Wait",
        distance: "Distance",
        queue: "Queue",
        capacity: "Capacity",
        score: "Score",
        why: "Why this centre?",
        alternatives: "Other Options",
        details: "Centre Details",
        map: "Map",
        mapPending: "Map integration will be added in the next phase.",
        directions: "Get Directions",
        activityTitle: "Your Activity",
        activityEmpty: "No previous activity available yet.",
        sahayak: "Sahayak",
        sahayakTitle: "Sahayak",
        sahayakText: "AI assistant will be connected in a later phase.",
        close: "Close",
        dataNote:
          "Prototype operational conditions and predictions currently use synthetic data.",
        invalidQuantity: "Please enter a valid quantity.",
        locationRequired:
          "Please enter your location or use your current location.",
        error: "Unable to get recommendations. Please try again.",
      };

  function goToLocation() {
    setError("");
    setScreen("location");
  }

  function detectLocation() {
    if (!navigator.geolocation) {
      setError(
        hindi
          ? "आपके डिवाइस में location support उपलब्ध नहीं है।"
          : "Location support is not available on this device."
      );
      return;
    }

    setLocationLoading(true);
    setError("");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude.toFixed(5);
        const lon = position.coords.longitude.toFixed(5);

        setLocationText(`${lat}, ${lon}`);
        setLocationEnabled(true);
        setLocationLoading(false);
      },
      () => {
        setLocationLoading(false);
        setError(
          hindi
            ? "Location permission नहीं मिली।"
            : "Location permission was not granted."
        );
      }
    );
  }

  function continueFromLocation() {
    if (!locationText.trim()) {
      setError(t.locationRequired);
      return;
    }

    setError("");
    setScreen("crop");
  }

  async function handleRecommendation() {
    const quantityValue = Number(quantity);

    if (!quantityValue || quantityValue <= 0) {
      setError(t.invalidQuantity);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const result = await recommendCentres({
        crop,
        quantity_quintals: quantityValue,
        hour: new Date().getHours(),
        day_of_week: new Date().getDay(),
        weather: "Clear",
      });

      setRecommendation(result);
      setSelectedCentre(result.recommended_centre);
      setScreen("recommendation");
    } catch {
      setError(t.error);
    } finally {
      setLoading(false);
    }
  }

  function openCentre(centre: Centre) {
    setSelectedCentre(centre);
    setScreen("details");
  }

  function goBack() {
    if (screen === "location") setScreen("dashboard");
    else if (screen === "crop") setScreen("location");
    else if (screen === "recommendation") setScreen("crop");
    else if (screen === "details") setScreen("recommendation");
    else if (screen === "activity") setScreen("dashboard");
    else router.push("/");
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-5xl px-4 py-5 sm:px-6 sm:py-8">

        <header className="flex items-center justify-between">
          <button
            onClick={() => setScreen("dashboard")}
            className="text-left"
          >
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
                ProcureSmart
              </h1>

              <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-semibold text-amber-800">
                {t.prototype}
              </span>
            </div>

            <p className="mt-1 text-xs text-slate-500">{t.farmer}</p>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setHindi(!hindi)}
              className="rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 shadow-sm"
            >
              {t.language}
            </button>

            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-700">
              F
            </div>
          </div>
        </header>

        {screen !== "dashboard" && (
          <button
            onClick={goBack}
            className="mt-6 text-sm font-medium text-slate-600 hover:text-slate-900"
          >
            ← {t.back}
          </button>
        )}

        {screen === "dashboard" && (
          <>
            <section className="mt-8">
              <p className="text-sm font-medium text-emerald-700">
                {t.greeting}
              </p>

              <h2 className="mt-2 max-w-2xl text-3xl font-bold leading-tight tracking-tight text-slate-900 sm:text-4xl">
                {t.dashboardTitle}
              </h2>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
                {t.dashboardSub}
              </p>
            </section>

            <section className="mt-7">
              <button
                onClick={goToLocation}
                className="group w-full rounded-3xl bg-slate-900 p-6 text-left text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-slate-800 sm:p-8"
              >
                <div className="flex items-start justify-between gap-5">
                  <div>
                    <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500 text-xl">
                      📍
                    </div>

                    <h3 className="text-2xl font-bold sm:text-3xl">
                      {t.find}
                    </h3>

                    <p className="mt-2 max-w-xl text-sm leading-6 text-slate-300 sm:text-base">
                      {t.findSub}
                    </p>
                  </div>

                  <div className="hidden text-3xl transition group-hover:translate-x-1 sm:block">
                    →
                  </div>
                </div>

                <div className="mt-6 inline-flex rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-900">
                  {t.continue} →
                </div>
              </button>
            </section>

            <section className="mt-6 grid gap-5 md:grid-cols-2">
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">
                      {t.marketSub}
                    </p>

                    <h3 className="mt-2 text-xl font-bold text-slate-900">
                      {t.market}
                    </h3>
                  </div>

                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-lg">
                    ₹
                  </div>
                </div>

                <div className="mt-5 rounded-2xl bg-slate-50 p-4">
                  <p className="text-sm font-medium text-slate-700">
                    {t.pending}
                  </p>

                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    Prices will only be shown after reliable market data is
                    connected.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setScreen("activity")}
                className="rounded-3xl border border-slate-200 bg-white p-6 text-left shadow-sm transition hover:border-slate-300"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                      {t.activity}
                    </p>

                    <h3 className="mt-2 text-xl font-bold text-slate-900">
                      {t.plan}
                    </h3>
                  </div>

                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-lg">
                    🌾
                  </div>
                </div>

                <p className="mt-5 text-sm leading-6 text-slate-600">
                  {t.activitySub}
                </p>
              </button>
            </section>
          </>
        )}

        {screen === "location" && (
          <section className="mt-8">
            <div className="max-w-2xl">
              <p className="text-sm font-medium text-emerald-700">
                STEP 1
              </p>

              <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
                {t.locationTitle}
              </h2>

              <p className="mt-3 text-sm leading-6 text-slate-600">
                {t.locationSub}
              </p>
            </div>

            <div className="mt-7 max-w-2xl rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <button
                onClick={detectLocation}
                disabled={locationLoading}
                className="w-full rounded-2xl bg-emerald-600 px-5 py-4 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60"
              >
                {locationLoading
                  ? "Detecting location..."
                  : `📍 ${t.useLocation}`}
              </button>

              <div className="my-5 flex items-center gap-3 text-xs text-slate-400">
                <div className="h-px flex-1 bg-slate-200" />
                OR
                <div className="h-px flex-1 bg-slate-200" />
              </div>

              <label className="mb-2 block text-sm font-medium text-slate-700">
                {t.manual}
              </label>

              <input
                value={locationText}
                onChange={(e) => {
                  setLocationText(e.target.value);
                  setLocationEnabled(false);
                }}
                placeholder={t.locationPlaceholder}
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none focus:border-emerald-500"
              />

              {locationText && (
                <div className="mt-3 rounded-xl bg-emerald-50 px-4 py-3 text-xs font-medium text-emerald-700">
                  {locationEnabled ? t.locationDetected : locationText}
                </div>
              )}

              {error && (
                <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <button
                onClick={continueFromLocation}
                className="mt-5 w-full rounded-2xl bg-slate-900 px-5 py-4 text-sm font-semibold text-white hover:bg-slate-800"
              >
                {t.continue} →
              </button>
            </div>
          </section>
        )}

        {screen === "crop" && (
          <section className="mt-8">
            <div className="max-w-2xl">
              <p className="text-sm font-medium text-emerald-700">
                STEP 2
              </p>

              <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
                {t.cropTitle}
              </h2>

              <p className="mt-3 text-sm leading-6 text-slate-600">
                {t.cropSub}
              </p>
            </div>

            <div className="mt-7 max-w-2xl rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <label className="mb-2 block text-sm font-medium text-slate-700">
                {t.crop}
              </label>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
                {crops.map((item) => (
                  <button
                    key={item}
                    onClick={() => setCrop(item)}
                    className={`rounded-2xl border px-3 py-3 text-sm font-medium transition ${
                      crop === item
                        ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                        : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </div>

              <label className="mb-2 mt-6 block text-sm font-medium text-slate-700">
                {t.quantity}
              </label>

              <input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder={t.quantityPlaceholder}
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-slate-900 outline-none focus:border-emerald-500"
              />

              {error && (
                <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <button
                onClick={handleRecommendation}
                disabled={loading}
                className="mt-6 w-full rounded-2xl bg-slate-900 px-5 py-4 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? t.finding : `${t.findCentre} →`}
              </button>
            </div>
          </section>
        )}

        {screen === "recommendation" && recommendation && (
          <section className="mt-8">
            <div>
              <p className="text-sm font-medium text-emerald-700">
                RECOMMENDATION
              </p>

              <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
                {t.recommended}
              </h2>
            </div>

            <div className="mt-7 rounded-3xl border border-emerald-200 bg-emerald-50 p-5 sm:p-7">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-emerald-700">
                    #{recommendation.recommended_centre.rank}
                  </p>

                  <h3 className="mt-1 text-2xl font-bold text-slate-900 sm:text-3xl">
                    {recommendation.recommended_centre.centre_name}
                  </h3>

                  <p className="mt-1 text-sm text-slate-600">
                    {recommendation.recommended_centre.centre_id}
                  </p>
                </div>

                <div className="rounded-full bg-emerald-600 px-4 py-2 text-xs font-bold text-white">
                  {recommendation.recommended_centre.score}
                </div>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <Metric
                  label={t.wait}
                  value={`${recommendation.recommended_centre.predicted_waiting_time_minutes} min`}
                />

                <Metric
                  label={t.distance}
                  value={`${recommendation.recommended_centre.distance_km} km`}
                />

                <Metric
                  label={t.queue}
                  value={`${recommendation.recommended_centre.queue_length}`}
                />

                <Metric
                  label={t.capacity}
                  value={`${recommendation.recommended_centre.capacity_used_pct}%`}
                />
              </div>

              <div className="mt-4 rounded-2xl bg-white p-4">
                <p className="text-sm font-semibold text-slate-900">
                  {t.why}
                </p>

                <p className="mt-1 text-sm leading-6 text-slate-600">
                  {recommendation.recommended_centre.reason}
                </p>
              </div>

              <button
                onClick={() =>
                  openCentre(recommendation.recommended_centre)
                }
                className="mt-5 w-full rounded-2xl bg-slate-900 px-5 py-4 text-sm font-semibold text-white hover:bg-slate-800"
              >
                {t.details} →
              </button>
            </div>

            {recommendation.alternatives.length > 0 && (
              <div className="mt-7">
                <h3 className="text-lg font-bold text-slate-900">
                  {t.alternatives}
                </h3>

                <div className="mt-3 space-y-3">
                  {recommendation.alternatives.slice(0, 3).map((item) => (
                    <button
                      key={item.centre_id}
                      onClick={() => openCentre(item)}
                      className="w-full rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:border-slate-300"
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <p className="font-semibold text-slate-900">
                            {item.centre_name}
                          </p>

                          <p className="mt-1 text-sm text-slate-500">
                            {item.predicted_waiting_time_minutes} min ·{" "}
                            {item.distance_km} km · {item.queue_length} queue
                          </p>
                        </div>

                        <span className="text-sm font-bold text-slate-500">
                          #{item.rank}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs leading-5 text-amber-800">
              {t.dataNote}
            </div>
          </section>
        )}

        {screen === "details" && selectedCentre && (
          <section className="mt-8">
            <p className="text-sm font-medium text-emerald-700">
              {t.details}
            </p>

            <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
              {selectedCentre.centre_name}
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              {selectedCentre.centre_id}
            </p>

            <div className="mt-6 grid gap-5 md:grid-cols-2">
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="text-lg font-bold text-slate-900">
                  Current Conditions
                </h3>

                <div className="mt-5 space-y-4">
                  <DetailRow
                    label={t.wait}
                    value={`${selectedCentre.predicted_waiting_time_minutes} min`}
                  />

                  <DetailRow
                    label={t.distance}
                    value={`${selectedCentre.distance_km} km`}
                  />

                  <DetailRow
                    label={t.queue}
                    value={`${selectedCentre.queue_length}`}
                  />

                  <DetailRow
                    label={t.capacity}
                    value={`${selectedCentre.capacity_used_pct}%`}
                  />

                  <DetailRow
                    label="Active Counters"
                    value={`${selectedCentre.active_counters}`}
                  />
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="text-lg font-bold text-slate-900">
                  {t.map}
                </h3>

                <div className="mt-4 flex h-56 items-center justify-center rounded-2xl bg-slate-100">
                  <div className="px-6 text-center">
                    <div className="text-4xl">🗺️</div>

                    <p className="mt-3 text-sm font-medium text-slate-700">
                      {t.mapPending}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() =>
                    alert(
                      hindi
                        ? "Directions integration अगले चरण में जोड़ी जाएगी।"
                        : "Directions integration will be added in the next phase."
                    )
                  }
                  className="mt-4 w-full rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  {t.directions}
                </button>
              </div>
            </div>

            <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs leading-5 text-amber-800">
              {t.dataNote}
            </div>
          </section>
        )}

        {screen === "activity" && (
          <section className="mt-8">
            <p className="text-sm font-medium text-emerald-700">
              {t.activity}
            </p>

            <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
              {t.activityTitle}
            </h2>

            <div className="mt-7 rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
              <div className="text-4xl">🌾</div>

              <p className="mt-4 text-sm font-medium text-slate-700">
                {t.activityEmpty}
              </p>

              <p className="mt-2 text-xs leading-5 text-slate-500">
                Activity history will be connected to the database in a later
                integration phase.
              </p>
            </div>
          </section>
        )}

        <p className="mt-8 text-center text-xs text-slate-400">
          ProcureSmart · Sahi Jankari, Sahi Samay
        </p>
      </div>

      <button
        onClick={() => setShowSahayak(!showSahayak)}
        className="fixed bottom-5 right-5 z-30 flex items-center gap-2 rounded-full bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-emerald-700"
      >
        <span>🤖</span>
        {t.sahayak}
      </button>

      {showSahayak && (
        <div className="fixed bottom-20 right-5 z-30 w-[calc(100%-40px)] max-w-sm rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-lg font-bold text-slate-900">
                {t.sahayakTitle}
              </p>

              <p className="mt-2 text-sm leading-6 text-slate-600">
                {t.sahayakText}
              </p>
            </div>

            <button
              onClick={() => setShowSahayak(false)}
              className="text-slate-400 hover:text-slate-700"
            >
              ✕
            </button>
          </div>

          <div className="mt-4 rounded-xl bg-slate-50 p-3 text-xs text-slate-500">
            Phase 7 · Conversational AI Assistant
          </div>
        </div>
      )}
    </main>
  );
}

function Metric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl bg-white p-4">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 text-lg font-bold text-slate-900">{value}</p>
    </div>
  );
}

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-3 last:border-0 last:pb-0">
      <span className="text-sm text-slate-500">{label}</span>
      <span className="text-sm font-semibold text-slate-900">{value}</span>
    </div>
  );
      }
