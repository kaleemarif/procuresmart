const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://procuresmart-cxx8.onrender.com";

/* =========================
   BACKEND HEALTH
========================= */

export async function checkBackendHealth() {
  const response = await fetch(`${API_URL}/health`);

  if (!response.ok) {
    throw new Error("Backend is unavailable");
  }

  return response.json();
}

/* =========================
   RECOMMENDATION ENGINE
========================= */

export async function recommendCentres(input: {
  crop: string;
  quantity_quintals: number;
  hour?: number;
  day_of_week?: number;
  weather?: string;
  farmer_latitude?: number;
  farmer_longitude?: number;
}) {
  const response = await fetch(`${API_URL}/recommend`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    throw new Error("Recommendation request failed");
  }

  return response.json();
}

/* =========================
   SAHAYAK AI CHATBOT
========================= */

export async function chatWithSahayak(
  messages: Array<{
    role: "user" | "assistant";
    content: string;
  }>,
  farmer_context?: {
    latitude?: number;
    longitude?: number;
    farmer_id?: string;
    booking_id?: string;
  }
) {
  const response = await fetch(`${API_URL}/chatbot/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messages,
      farmer_context,
    }),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));

    throw new Error(data.detail || "Sahayak request failed");
  }

  return response.json();
}

/* =========================
   FARMER REGISTRATION
========================= */

export async function registerFarmer(input: {
  name: string;
  mobile: string;
  village?: string;
  latitude?: number;
  longitude?: number;
  crop: string;
  quantity_quintals: number;
}) {
  const response = await fetch(`${API_URL}/procurement/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));

    throw new Error(data.detail || "Farmer registration failed");
  }

  return response.json();
}

/* =========================
   AVAILABLE PROCUREMENT SLOTS
========================= */

export async function getSlots(input: {
  centre_id: string;
  slot_date: string;
}) {
  const params = new URLSearchParams({
    centre_id: input.centre_id,
    slot_date: input.slot_date,
  });

  const response = await fetch(
    `${API_URL}/procurement/slots?${params.toString()}`
  );

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));

    throw new Error(data.detail || "Unable to fetch slots");
  }

  return response.json();
}

/* =========================
   CREATE BOOKING
========================= */

export async function createBooking(input: {
  farmer_id: string;
  centre_id: string;
  crop: string;
  quantity_quintals: number;
  slot_date: string;
  slot_start: string;
  slot_end: string;
}) {
  const response = await fetch(`${API_URL}/procurement/book`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));

    throw new Error(data.detail || "Booking failed");
  }

  return response.json();
}

/* =========================
   BOOKING / PROCUREMENT STATUS
========================= */

export async function getBooking(bookingId: string) {
  const response = await fetch(
    `${API_URL}/procurement/booking/${encodeURIComponent(bookingId)}`
  );

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));

    throw new Error(data.detail || "Unable to fetch booking status");
  }

  return response.json();
}

/* =========================
   FARMER NOTIFICATIONS
========================= */

export async function getNotifications(farmerId: string) {
  const response = await fetch(
    `${API_URL}/procurement/notifications/${encodeURIComponent(farmerId)}`
  );

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));

    throw new Error(data.detail || "Unable to fetch notifications");
  }

  return response.json();
}

/* =========================
   OPERATOR — BOOKINGS
========================= */

export async function getOperatorBookings() {
  const response = await fetch(`${API_URL}/procurement/operator/bookings`);

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));

    throw new Error(data.detail || "Unable to fetch procurement bookings");
  }

  return response.json();
}

/* =========================
   OPERATOR — UPDATE BOOKING
========================= */

export async function updateBookingStatus(
  bookingId: string,
  status:
    | "Booked"
    | "Arrived"
    | "Verification"
    | "Weighing"
    | "Procured"
    | "Payment Initiated"
    | "Payment Completed"
) {
  const response = await fetch(
    `${API_URL}/procurement/operator/bookings/${encodeURIComponent(
      bookingId
    )}`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        status,
      }),
    }
  );

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));

    throw new Error(data.detail || "Unable to update booking status");
  }

  return response.json();
                    }
