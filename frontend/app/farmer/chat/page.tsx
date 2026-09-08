"use client";

import { useEffect, useMemo, useState } from "react";

type Message = {
  role: "user" | "assistant";
  content: string;
};

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "https://procuresmart-cxx8.onrender.com";

const initialMessage: Message = {
  role: "assistant",
  content:
    "Namaste! Main Sahayak hoon. 🌾\n\nMain aapko procurement centre choose karne mein help kar sakta hoon. Aap crop aur quantity bataiye. Recommendation ke liye aapki location bhi chahiye hogi.",
};

export default function FarmerChatPage() {
  const [messages, setMessages] = useState<Message[]>([initialMessage]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [location, setLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [farmerId, setFarmerId] = useState<string | undefined>();
  const [bookingId, setBookingId] = useState<string | undefined>();

  useEffect(() => {
    setFarmerId(localStorage.getItem("procuresmart_farmer_id") || undefined);
    setBookingId(localStorage.getItem("procuresmart_booking_id") || undefined);
  }, []);

  const canSend = useMemo(
    () => input.trim().length > 0 && !loading,
    [input, loading]
  );

  function getLocation() {
    if (!navigator.geolocation) {
      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content: "Aapke browser mein location access available nahi hai.",
        },
      ]);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        setMessages((current) => [
          ...current,
          {
            role: "assistant",
            content:
              "Location mil gayi. Ab aap crop aur quantity bata sakte hain, jaise: Wheat, 25 quintal.",
          },
        ]);
      },
      () => {
        setMessages((current) => [
          ...current,
          {
            role: "assistant",
            content:
              "Location access nahi mil paya. Recommendation ke liye location deni hogi.",
          },
        ]);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  async function sendMessage() {
    if (!canSend) return;

    const userMessage: Message = {
      role: "user",
      content: input.trim(),
    };

    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setInput("");
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/chatbot/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: nextMessages,
          farmer_context: {
            ...(location || {}),
            farmer_id: farmerId,
            booking_id: bookingId,
          },
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Sahayak request failed");
      }

      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content: data.message,
        },
      ]);
    } catch (error) {
      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content:
            "Sorry, abhi verified procurement information fetch nahi ho pa rahi hai. Please thodi der baad try karein.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto flex min-h-screen max-w-3xl flex-col">
        <header className="border-b bg-white px-5 py-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-green-700">
                ProcureSmart
              </p>
              <h1 className="text-xl font-bold text-slate-900">
                Sahayak
              </h1>
              <p className="text-sm text-slate-500">
                Verified procurement guidance assistant
              </p>
            </div>
            <div className="rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700">
              AI Assistant
            </div>
          </div>
        </header>

        <section className="flex-1 space-y-4 overflow-y-auto px-4 py-5">
          {messages.map((message, index) => (
            <div
              key={`${message.role}-${index}`}
              className={`flex ${
                message.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm leading-6 shadow-sm ${
                  message.role === "user"
                    ? "rounded-br-md bg-green-700 text-white"
                    : "rounded-bl-md border border-slate-200 bg-white text-slate-800"
                }`}
              >
                {message.content}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="rounded-2xl rounded-bl-md border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500">
                Sahayak verified data check kar raha hai…
              </div>
            </div>
          )}
        </section>

        <footer className="border-t bg-white p-4">
          <div className="mb-3 flex gap-2">
            <button
              type="button"
              onClick={getLocation}
              className={`rounded-xl border px-3 py-2 text-sm font-medium ${
                location
                  ? "border-green-200 bg-green-50 text-green-700"
                  : "border-slate-200 bg-slate-50 text-slate-700"
              }`}
            >
              {location ? "✓ Location ready" : "📍 Use my location"}
            </button>
          </div>

          <div className="flex gap-2">
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") sendMessage();
              }}
              placeholder="Ask Sahayak…"
              className="min-w-0 flex-1 rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-green-600"
              disabled={loading}
            />
            <button
              type="button"
              onClick={sendMessage}
              disabled={!canSend}
              className="rounded-xl bg-green-700 px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              Send
            </button>
          </div>

          <p className="mt-2 text-center text-[11px] text-slate-400">
            Prototype data is synthetic. Sahayak does not invent live centre facts.
          </p>
        </footer>
      </div>
    </main>
  );
}
