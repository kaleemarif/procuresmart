const API_URL =
 process.env.NEXT_PUBLIC_API_URL || "https://procuresmart-cxx8.onrender.com"

export async function checkBackendHealth() {
  const response = await fetch(`${API_URL}/health`);

  if (!response.ok) {
    throw new Error("Backend is unavailable");
  }

  return response.json();
}
