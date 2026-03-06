import { useEffect, useMemo, useState } from "react";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";

const QUICK_SEARCH = [
  { value: "cleaner", labelKey: "quickSearchCleaner" },
  { value: "electrical", labelKey: "quickSearchElectrical" },
  { value: "plumber", labelKey: "quickSearchPlumber" },
  { value: "ac repair", labelKey: "quickSearchAcRepair" },
  { value: "painting", labelKey: "quickSearchPainting" }
];

function statusKey(status) {
  return `status_${String(status).toLowerCase()}`;
}

function issueLevelKey(level) {
  return String(level).toLowerCase();
}

export default function HomePage() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [filters, setFilters] = useState({ city: "", q: "" });
  const [services, setServices] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [bookingInputs, setBookingInputs] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [bookingMessage, setBookingMessage] = useState("");

  const providerList = useMemo(() => {
    const map = new Map();
    for (const service of services) {
      const provider = service.provider;
      if (!provider) continue;
      if (!map.has(provider.id)) {
        map.set(provider.id, provider);
      }
    }
    return Array.from(map.values());
  }, [services]);

  const stats = useMemo(() => {
    const booked = bookings.length;
    const accepted = bookings.filter((b) => b.status === "ACCEPTED" || b.status === "COMPLETED").length;
    const rejected = bookings.filter((b) => b.status === "QUOTE_REJECTED" || b.status === "CANCELLED").length;
    const pending = bookings.filter((b) => b.status === "PENDING" || b.status === "QUOTE_SENT").length;

    return {
      providerCount: providerList.length,
      booked,
      accepted,
      rejected,
      pending
    };
  }, [bookings, providerList.length]);

  async function loadAll(nextFilters = filters) {
    setError("");
    setLoading(true);
    try {
      const tasks = [api.listServices(nextFilters), api.myBookings()];
      const [servicesData, bookingsData] = await Promise.all(tasks);
      setServices(servicesData);
      setBookings(bookingsData);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function setBookingInput(serviceId, field, value) {
    setBookingInputs((prev) => ({
      ...prev,
      [serviceId]: {
        issueLevel: "SMALL",
        problemText: "",
        scheduledAt: "",
        ...prev[serviceId],
        [field]: value
      }
    }));
  }

  async function bookService(service) {
    const payload = bookingInputs[service.id] || {};
    if (!payload.scheduledAt) {
      setBookingMessage(t("pleaseSelectDate"));
      return;
    }

    try {
      await api.createBooking({
        serviceId: service.id,
        scheduledAt: new Date(payload.scheduledAt).toISOString(),
        issueLevel: payload.issueLevel || "SMALL",
        problemText: payload.problemText || undefined
      });
      setBookingMessage(t("requestSent"));
      setTimeout(() => setBookingMessage(""), 3000);
      await loadAll();
    } catch (e) {
      setBookingMessage(e.message);
      setTimeout(() => setBookingMessage(""), 3000);
    }
  }

  function applyQuickSearch(value) {
    const next = { ...filters, q: value };
    setFilters(next);
    loadAll(next);
  }

  return (
    <div className="container">
      <h1>{t("userDashboard")}</h1>

      <div className="card">
        <h3>{t("profile")}</h3>
        <p>{t("fullName")}: {user?.name}</p>
        <p>{t("email")}: {user?.email}</p>
        <p>{t("city")}: {user?.city || t("noData")}</p>
        <p>{t("phone")}: {user?.phone || t("noData")}</p>
      </div>

      <div className="stats-grid">
        <article className="card stat-card">
          <h4>{t("providersAvailable")}</h4>
          <p>{stats.providerCount}</p>
        </article>
        <article className="card stat-card">
          <h4>{t("booked")}</h4>
          <p>{stats.booked}</p>
        </article>
        <article className="card stat-card">
          <h4>{t("accepted")}</h4>
          <p>{stats.accepted}</p>
        </article>
        <article className="card stat-card">
          <h4>{t("rejected")}</h4>
          <p>{stats.rejected}</p>
        </article>
        <article className="card stat-card">
          <h4>{t("pending")}</h4>
          <p>{stats.pending}</p>
        </article>
      </div>

      <div className="card">
        <h3>{t("providersAvailable")}</h3>
        <div className="grid">
          {providerList.map((provider) => (
            <article className="card" key={provider.id}>
              <h4>{provider.shopName || provider.name}</h4>
              {provider.workType && <p>{t("work")}: {provider.workType}</p>}
              {provider.shopAddress && <p>{t("address")}: {provider.shopAddress}</p>}
              <p>{t("phone")}: {provider.phone || t("noData")}</p>
              {provider.phone && (
                <a className="call-link" href={`tel:${provider.phone}`}>
                  {t("callProvider")}
                </a>
              )}
            </article>
          ))}
        </div>
      </div>

      <h3>{t("userServices")}</h3>
      <p className="muted">{t("searchHint")}</p>

      <div className="quick-row">
        {QUICK_SEARCH.map((item) => (
          <button key={item.value} className="chip-btn" onClick={() => applyQuickSearch(item.value)}>
            {t(item.labelKey)}
          </button>
        ))}
      </div>

      <div className="card form-grid">
        <input
          placeholder={t("city")}
          value={filters.city}
          onChange={(e) => setFilters((prev) => ({ ...prev, city: e.target.value }))}
        />
        <input
          placeholder={t("searchPlaceholder")}
          value={filters.q}
          onChange={(e) => setFilters((prev) => ({ ...prev, q: e.target.value }))}
        />
        <button onClick={() => loadAll()}>{loading ? t("loading") : t("search")}</button>
      </div>

      {error && <p className="error">{error}</p>}
      {bookingMessage && <p className="success">{bookingMessage}</p>}

      <div className="grid">
        {services.map((service) => {
          const input = bookingInputs[service.id] || { issueLevel: "SMALL", problemText: "", scheduledAt: "" };
          return (
            <article className="card" key={service.id}>
              <h3>{service.title}</h3>
              <p>{service.description}</p>
              <p className="muted">{service.category} | {service.city}</p>
              <p className="muted">{t("shop")}: {service.provider.shopName || service.provider.name}</p>
              {service.provider.workType && <p className="muted">{t("work")}: {service.provider.workType}</p>}
              {service.provider.shopAddress && <p className="muted">{t("address")}: {service.provider.shopAddress}</p>}

              <div className="price-box">
                <p>{t("minor")}: Rs. {service.minorPrice ?? service.price}</p>
                <p>{t("small")}: Rs. {service.smallPrice ?? service.price}</p>
                <p>{t("major")}: Rs. {service.majorPrice ?? service.price}</p>
                <p>{t("custom")}: {t("customQuote")}</p>
              </div>

              <div className="form-grid">
                <label>
                  {t("issueLevel")}
                  <select
                    value={input.issueLevel}
                    onChange={(e) => setBookingInput(service.id, "issueLevel", e.target.value)}
                  >
                    <option value="MINOR">{t("minor")}</option>
                    <option value="SMALL">{t("small")}</option>
                    <option value="MAJOR">{t("major")}</option>
                    <option value="CUSTOM">{t("custom")}</option>
                  </select>
                </label>
                <input
                  placeholder={t("problemText")}
                  value={input.problemText}
                  onChange={(e) => setBookingInput(service.id, "problemText", e.target.value)}
                />
                <input
                  type="datetime-local"
                  value={input.scheduledAt}
                  onChange={(e) => setBookingInput(service.id, "scheduledAt", e.target.value)}
                />
                <div className="btn-row">
                  <button onClick={() => bookService(service)}>{t("bookService")}</button>
                  {service.provider.phone && (
                    <a className="call-link" href={`tel:${service.provider.phone}`}>
                      {t("callProvider")}
                    </a>
                  )}
                </div>
              </div>
            </article>
          );
        })}
      </div>

      <div className="card">
        <h3>{t("myBookings")}</h3>
        <div className="grid">
          {bookings.map((booking) => (
            <article className="card" key={booking.id}>
              <h4>{booking.service.title}</h4>
              <p>{t("status")}: {t(statusKey(booking.status))}</p>
              <p>{t("issueLevel")}: {t(issueLevelKey(booking.issueLevel))}</p>
              <p>{t("scheduled")}: {new Date(booking.scheduledAt).toLocaleString()}</p>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
