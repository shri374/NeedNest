import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { useLanguage } from "../context/LanguageContext";

export default function BookingsPage() {
  const { t } = useLanguage();
  const [bookings, setBookings] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  function getStatusLabel(status) {
    return t(`status_${String(status).toLowerCase()}`);
  }

  function getIssueLevelLabel(level) {
    return t(String(level).toLowerCase());
  }

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
    const ratingRaw = prompt(t("ratingPrompt"));
    if (!ratingRaw) return;

    const comment = prompt(t("commentPrompt")) || undefined;

    try {
      await api.createReview({ bookingId, rating: Number(ratingRaw), comment });
      await loadBookings();
      alert(t("reviewSubmitted"));
    } catch (e) {
      alert(e.message);
    }
  }

  async function respondQuote(bookingId, accepted) {
    try {
      await api.respondQuote(bookingId, accepted);
      await loadBookings();
    } catch (e) {
      alert(e.message);
    }
  }

  useEffect(() => {
    loadBookings();
  }, []);

  return (
    <div className="container">
      <h2>{t("myBookings")}</h2>
      {loading && <p>{t("loading")}</p>}
      {error && <p className="error">{error}</p>}

      <div className="grid">
        {bookings.map((booking) => (
          <article key={booking.id} className="card">
            <h3>{booking.service.title}</h3>
            <p className="muted">{t("status")}: {getStatusLabel(booking.status)}</p>
            <p>{t("issueLevel")}: {getIssueLevelLabel(booking.issueLevel)}</p>
            {booking.problemText && <p>{t("problemText")}: {booking.problemText}</p>}
            {booking.requestedPrice && <p>{t("selectedAmount")}: Rs. {booking.requestedPrice}</p>}
            {booking.quotedPrice && <p>{t("providerQuote")}: Rs. {booking.quotedPrice}</p>}
            {booking.quoteNote && <p>{t("quoteNote")}: {booking.quoteNote}</p>}
            <p>{t("scheduled")}: {new Date(booking.scheduledAt).toLocaleString()}</p>
            <p>{t("provider")}: {booking.service.provider.shopName || booking.service.provider.name}</p>
            <p>{t("phone")}: {booking.service.provider.phone || t("noData")}</p>
            {booking.service.provider.phone && (
              <a className="call-link" href={`tel:${booking.service.provider.phone}`}>
                {t("callProvider")}
              </a>
            )}

            {booking.status === "QUOTE_SENT" && (
              <div className="btn-row">
                <button onClick={() => respondQuote(booking.id, true)}>{t("accept")}</button>
                <button onClick={() => respondQuote(booking.id, false)}>{t("reject")}</button>
              </div>
            )}

            {booking.status === "COMPLETED" && !booking.review && (
              <button onClick={() => addReview(booking.id)}>{t("addReview")}</button>
            )}
          </article>
        ))}
      </div>
    </div>
  );
}
