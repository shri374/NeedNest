import { useEffect, useMemo, useState } from "react";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";

const QUICK_CATEGORIES = ["Cleaning", "Electrical", "Plumbing", "AC Repair", "Painter"];

export default function HomePage() {
  const { user } = useAuth();

  const [filters, setFilters] = useState({ city: "", q: "" });
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [bookingMessage, setBookingMessage] = useState("");

  const canBook = useMemo(() => user?.role === "USER" || user?.role === "ADMIN", [user]);

  async function searchServices(nextFilters = filters) {
    setError("");
    setLoading(true);
    try {
      const data = await api.listServices(nextFilters);
      setServices(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    searchServices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function bookService(serviceId) {
    const localValue = prompt("Enter schedule (YYYY-MM-DDTHH:mm), example: 2026-03-12T10:30");
    if (!localValue) return;

    const date = new Date(localValue);
    if (Number.isNaN(date.getTime())) {
      setBookingMessage("Invalid date-time format.");
      return;
    }

    try {
      await api.createBooking({ serviceId, scheduledAt: date.toISOString() });
      setBookingMessage("Booking request created.");
      setTimeout(() => setBookingMessage(""), 3000);
    } catch (e) {
      setBookingMessage(e.message);
      setTimeout(() => setBookingMessage(""), 3000);
    }
  }

  function applyQuickCategory(category) {
    const next = { ...filters, q: category };
    setFilters(next);
    searchServices(next);
  }

  return (
    <div className="container">
      <h1>NeedNest User Services</h1>
      <p className="muted">Search with keywords like cleaner, electrical, plumber, AC repair.</p>

      <div className="quick-row">
        {QUICK_CATEGORIES.map((category) => (
          <button key={category} className="chip-btn" onClick={() => applyQuickCategory(category)}>
            {category}
          </button>
        ))}
      </div>

      <div className="card form-grid">
        <input
          placeholder="City"
          value={filters.city}
          onChange={(e) => setFilters((prev) => ({ ...prev, city: e.target.value }))}
        />
        <input
          placeholder="Search by service/shop (cleaner, electrical, patil services)"
          value={filters.q}
          onChange={(e) => setFilters((prev) => ({ ...prev, q: e.target.value }))}
        />
        <button onClick={() => searchServices()} disabled={loading}>
          {loading ? "Searching..." : "Search Services"}
        </button>
      </div>

      {error && <p className="error">{error}</p>}
      {bookingMessage && <p className="success">{bookingMessage}</p>}

      <div className="grid">
        {services.map((service) => (
          <article className="card" key={service.id}>
            {service.imageUrl && <img src={service.imageUrl} alt={service.title} className="cover" />}
            <h3>{service.title}</h3>
            <p>{service.description}</p>
            <p className="muted">
              {service.category} | {service.city}
            </p>
            <p>
              <strong>Rs. {service.price}</strong>
            </p>
            <p className="muted">Provider: {service.provider.name}</p>
            <p className="muted">Shop: {service.provider.shopName || "Not added yet"}</p>
            {service.provider.shopAddress && <p className="muted">Address: {service.provider.shopAddress}</p>}
            <p className="muted">
              Rating: {service.avgRating ?? "No ratings"} ({service.totalReviews})
            </p>

            {canBook ? (
              <button onClick={() => bookService(service.id)}>Book Service</button>
            ) : (
              <p className="muted">Login as User to book</p>
            )}
          </article>
        ))}
      </div>
    </div>
  );
}
