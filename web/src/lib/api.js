const API_BASE = "";

async function request(path, options = {}) {
  const token = localStorage.getItem("neednest_token");

  let res;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers || {})
      }
    });
  } catch {
    throw new Error("Cannot reach API. Run `npm run dev` from project root.");
  }

  const contentType = res.headers.get("content-type") || "";
  const data = contentType.includes("application/json") ? await res.json() : null;

  if (!res.ok) {
    const message = data?.message || "Request failed";
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
  updateBookingStatus: (bookingId, status) =>
    request(`/api/bookings/${bookingId}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status })
    }),

  createReview: (payload) => request("/api/reviews", { method: "POST", body: JSON.stringify(payload) })
};
