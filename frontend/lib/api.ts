const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://procuresmart-cxx8.onrender.com";

export async function checkBackendHealth() {
  const response = await fetch(`${API_URL}/health`);

  if (!response.ok) {
    throw new Error("Backend is unavailable");
  }

  return response.json();
}

export async function predictWaitingTime(input: {
  quantity_quintals: number;
  queue_length: number;
  active_counters: number;
  avg_processing_time: number;
  capacity_used_pct: number;
  hour: number;
  day_of_week: number;
  centre_id: string;
  crop: string;
  weather: string;
}) {
  const response = await fetch(`${API_URL}/ml/predict-waiting-time`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    throw new Error("Waiting-time prediction failed");
  }

  return response.json();
}
