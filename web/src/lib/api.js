const RAW_API_BASE = (import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || "").trim();
const API_BASE = RAW_API_BASE.replace(/\/+$/, "");

function buildUrl(path) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  if (!API_BASE) return normalizedPath;

  // Avoid accidental `/api/api/...` when API_BASE already ends with `/api`.
  if (API_BASE.endsWith("/api") && normalizedPath.startsWith("/api/")) {
    return `${API_BASE}${normalizedPath.slice(4)}`;
  }

  return `${API_BASE}${normalizedPath}`;
}

async function request(path, options = {}) {
  const token = localStorage.getItem("neednest_token");
  const url = buildUrl(path);

  let res;
  try {
    res = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers || {})
      }
    });
  } catch {
    throw new Error(
      `Cannot reach API at ${url}. Start API server or set VITE_API_URL (example: https://your-api-domain.com).`
    );
  }

  const contentType = res.headers.get("content-type") || "";
  const data = contentType.includes("application/json") ? await res.json().catch(() => null) : null;
  const text = data ? "" : await res.text().catch(() => "");

  if (!res.ok) {
    const message = data?.message || text || `Request failed (${res.status})`;
    throw new Error(message);
  }

  return data;
}

export const api = {
  register: (payload) => request("/api/auth/register", { method: "POST", body: JSON.stringify(payload) }),
  login: (payload) => request("/api/auth/login", { method: "POST", body: JSON.stringify(payload) }),
  me: () => request("/api/auth/me"),

  listServices: ({ city = "", category = "", q = "" } = {}) => {
    const params = new URLSearchParams();
    if (city) params.set("city", city);
    if (category) params.set("category", category);
    if (q) params.set("q", q);
    return request(`/api/services?${params.toString()}`);
  },
  myServices: () => request("/api/services/mine"),
  createService: (payload) => request("/api/services", { method: "POST", body: JSON.stringify(payload) }),
  toggleService: (serviceId) => request(`/api/services/${serviceId}/toggle`, { method: "PATCH" }),
  myShop: () => request("/api/providers/me/shop"),
  saveShop: (payload) =>
    request("/api/providers/me/shop", {
      method: "PUT",
      body: JSON.stringify(payload)
    }),

  createBooking: (payload) => request("/api/bookings", { method: "POST", body: JSON.stringify(payload) }),
  myBookings: () => request("/api/bookings/my"),
  providerBookings: () => request("/api/bookings/provider"),
  sendQuote: (bookingId, payload) =>
    request(`/api/bookings/${bookingId}/quote`, {
      method: "PATCH",
      body: JSON.stringify(payload)
    }),
  respondQuote: (bookingId, accepted) =>
    request(`/api/bookings/${bookingId}/quote-response`, {
      method: "PATCH",
      body: JSON.stringify({ accepted })
    }),
  updateBookingStatus: (bookingId, status) =>
    request(`/api/bookings/${bookingId}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status })
    }),

  createReview: (payload) => request("/api/reviews", { method: "POST", body: JSON.stringify(payload) })
};
