const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://procuresmart-cxx8.onrender.com";

export async function checkBackendHealth() {
  const response = await fetch(`${API_URL}/health`);

  if (!response.ok) {
    throw new Error("Backend is unavailable");
  }

  return response.json();
}

export async function recommendCentres(input: {
  crop: string;
  quantity_quintals: number;
  hour?: number;
  day_of_week?: number;
  weather?: string;
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
