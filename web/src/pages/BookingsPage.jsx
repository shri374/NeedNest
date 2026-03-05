import { useEffect, useState } from "react";
import { api } from "../lib/api";

export default function BookingsPage() {
  const [bookings, setBookings] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  async function loadBookings() {
    setLoading(true);
    setError("");

    try {
      const data = await api.myBookings();
      setBookings(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function addReview(bookingId) {
    const ratingRaw = prompt("Rating (1-5)");
    if (!ratingRaw) return;

    const comment = prompt("Comment (optional)") || undefined;

    try {
      await api.createReview({ bookingId, rating: Number(ratingRaw), comment });
      await loadBookings();
      alert("Review submitted");
    } catch (e) {
      alert(e.message);
    }
  }

  useEffect(() => {
    loadBookings();
  }, []);

  return (
    <div className="container">
      <h2>My Bookings</h2>
      {loading && <p>Loading...</p>}
      {error && <p className="error">{error}</p>}

      <div className="grid">
        {bookings.map((booking) => (
          <article key={booking.id} className="card">
            <h3>{booking.service.title}</h3>
            <p className="muted">Status: {booking.status}</p>
            <p>Scheduled: {new Date(booking.scheduledAt).toLocaleString()}</p>
            <p>Provider: {booking.service.provider.name}</p>
            <p>Phone: {booking.service.provider.phone || "N/A"}</p>

            {booking.status === "COMPLETED" && !booking.review && (
              <button onClick={() => addReview(booking.id)}>Add Review</button>
            )}
          </article>
        ))}
      </div>
    </div>
  );
}
