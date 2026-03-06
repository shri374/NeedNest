import { useEffect, useMemo, useState } from "react";
import { api } from "../lib/api";
import { useLanguage } from "../context/LanguageContext";

export default function ProviderPage() {
  const { t } = useLanguage();
  const [bookings, setBookings] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [shopMessage, setShopMessage] = useState("");
  const [quoteInputs, setQuoteInputs] = useState({});
  const [editShop, setEditShop] = useState(false);
  const [showServiceForm, setShowServiceForm] = useState(false);

  const [shopForm, setShopForm] = useState({
    shopName: "",
    shopDescription: "",
    shopAddress: "",
    workType: "",
    city: "",
    phone: ""
  });

  const [serviceForm, setServiceForm] = useState({
    title: "",
    description: "",
    category: "",
    workType: "",
    city: "",
    minorPrice: "",
    smallPrice: "",
    majorPrice: ""
  });

  const hasShopProfile = useMemo(
    () =>
      Boolean(
        shopForm.shopName ||
          shopForm.shopAddress ||
          shopForm.workType ||
          shopForm.shopDescription ||
          shopForm.city ||
          shopForm.phone
      ),
    [shopForm]
  );

  function getStatusLabel(status) {
    return t(`status_${String(status).toLowerCase()}`);
  }

  function getIssueLevelLabel(level) {
    return t(String(level).toLowerCase());
  }

  async function loadData() {
    setLoading(true);
    setError("");
    try {
      const [providerBookings, ownServices, shop] = await Promise.all([
        api.providerBookings(),
        api.myServices(),
        api.myShop()
      ]);
      setBookings(providerBookings);
      setServices(ownServices);
      setShopForm({
        shopName: shop.shopName || "",
        shopDescription: shop.shopDescription || "",
        shopAddress: shop.shopAddress || "",
        workType: shop.workType || "",
        city: shop.city || "",
        phone: shop.phone || ""
      });
      if (!shop.shopName) setEditShop(true);
      if (ownServices.length === 0) setShowServiceForm(true);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function saveShopProfile(e) {
    e.preventDefault();
    try {
      await api.saveShop({
        shopName: shopForm.shopName,
        shopDescription: shopForm.shopDescription || undefined,
        shopAddress: shopForm.shopAddress || undefined,
        workType: shopForm.workType || undefined,
        city: shopForm.city || undefined,
        phone: shopForm.phone || undefined
      });
      setShopMessage(t("save"));
      setEditShop(false);
      setTimeout(() => setShopMessage(""), 2500);
    } catch (e) {
      setShopMessage(e.message);
      setTimeout(() => setShopMessage(""), 2500);
    }
  }

  async function createService(e) {
    e.preventDefault();
    try {
      await api.createService({
        ...serviceForm,
        workType: serviceForm.workType || undefined,
        minorPrice: Number(serviceForm.minorPrice),
        smallPrice: Number(serviceForm.smallPrice),
        majorPrice: Number(serviceForm.majorPrice)
      });
      setServiceForm({
        title: "",
        description: "",
        category: "",
        workType: "",
        city: "",
        minorPrice: "",
        smallPrice: "",
        majorPrice: ""
      });
      await loadData();
    } catch (e) {
      alert(e.message);
    }
  }

  async function sendQuote(bookingId) {
    const value = quoteInputs[bookingId];
    if (!value?.quotedPrice) return;
    try {
      await api.sendQuote(bookingId, {
        quotedPrice: Number(value.quotedPrice),
        quoteNote: value.quoteNote || undefined
      });
      await loadData();
    } catch (e) {
      alert(e.message);
    }
  }

  async function updateStatus(bookingId, status) {
    try {
      await api.updateBookingStatus(bookingId, status);
      await loadData();
    } catch (e) {
      alert(e.message);
    }
  }

  async function toggleService(serviceId) {
    try {
      await api.toggleService(serviceId);
      await loadData();
    } catch (e) {
      alert(e.message);
    }
  }

  return (
    <div className="container">
      <h2>{t("providerDashboard")}</h2>
      {loading && <p>{t("loading")}</p>}
      {error && <p className="error">{error}</p>}

      {hasShopProfile && !editShop ? (
        <div className="card">
          <h3>{shopForm.shopName}</h3>
          <p>{t("address")}: {shopForm.shopAddress}</p>
          <p>{t("work")}: {shopForm.workType}</p>
          {shopForm.phone && <p>{t("phone")}: {shopForm.phone}</p>}
          {shopMessage && <p className="success">{shopMessage}</p>}
          <button onClick={() => setEditShop(true)}>{t("editDetails")}</button>
        </div>
      ) : (
        <form className="card form-grid" onSubmit={saveShopProfile}>
          <h3>{t("shopDetails")}</h3>
          <input
            placeholder={t("shopName")}
            value={shopForm.shopName}
            onChange={(e) => setShopForm((p) => ({ ...p, shopName: e.target.value }))}
            required
          />
          <input
            placeholder={t("address")}
            value={shopForm.shopAddress}
            onChange={(e) => setShopForm((p) => ({ ...p, shopAddress: e.target.value }))}
          />
          <input
            placeholder={t("typeOfWork")}
            value={shopForm.workType}
            onChange={(e) => setShopForm((p) => ({ ...p, workType: e.target.value }))}
          />
          <input
            placeholder={t("description")}
            value={shopForm.shopDescription}
            onChange={(e) => setShopForm((p) => ({ ...p, shopDescription: e.target.value }))}
          />
          <input
            placeholder={t("city")}
            value={shopForm.city}
            onChange={(e) => setShopForm((p) => ({ ...p, city: e.target.value }))}
          />
          <input
            placeholder={t("phone")}
            value={shopForm.phone}
            onChange={(e) => setShopForm((p) => ({ ...p, phone: e.target.value }))}
          />
          <div className="btn-row">
            <button type="submit">{t("saveShopProfile")}</button>
            {hasShopProfile && (
              <button type="button" onClick={() => setEditShop(false)}>
                {t("hideDetails")}
              </button>
            )}
          </div>
          {shopMessage && <p className="success">{shopMessage}</p>}
        </form>
      )}

      <div className="card">
        <div className="btn-row">
          <h3 style={{ margin: 0 }}>{t("incomingRequests")}</h3>
        </div>
        {bookings.length === 0 && <p className="muted">{t("noRequests")}</p>}
        {bookings.map((booking) => {
          const quote = quoteInputs[booking.id] || { quotedPrice: "", quoteNote: "" };
          return (
            <div className="request-row" key={booking.id}>
              <p><strong>{booking.service.title}</strong></p>
              <p>{t("customer")}: {booking.customer.name}</p>
              <p>{t("phone")}: {booking.customer.phone || t("noData")}</p>
              <p>{t("status")}: {getStatusLabel(booking.status)}</p>
              <p>{t("issueLevel")}: {getIssueLevelLabel(booking.issueLevel)}</p>
              {booking.problemText && <p>{t("problemText")}: {booking.problemText}</p>}
              {booking.requestedPrice && <p>{t("selectedAmount")}: Rs. {booking.requestedPrice}</p>}
              {booking.quotedPrice && <p>{t("providerQuote")}: Rs. {booking.quotedPrice}</p>}
              <p>{t("scheduled")}: {new Date(booking.scheduledAt).toLocaleString()}</p>

              <div className="btn-row">
                <input
                  type="number"
                  placeholder={t("quotePrice")}
                  value={quote.quotedPrice}
                  onChange={(e) =>
                    setQuoteInputs((prev) => ({
                      ...prev,
                      [booking.id]: { ...quote, quotedPrice: e.target.value }
                    }))
                  }
                />
                <input
                  placeholder={t("quoteNote")}
                  value={quote.quoteNote}
                  onChange={(e) =>
                    setQuoteInputs((prev) => ({
                      ...prev,
                      [booking.id]: { ...quote, quoteNote: e.target.value }
                    }))
                  }
                />
                <button onClick={() => sendQuote(booking.id)}>{t("sendQuote")}</button>
                <button onClick={() => updateStatus(booking.id, "ACCEPTED")}>{t("accept")}</button>
                <button onClick={() => updateStatus(booking.id, "CANCELLED")}>{t("reject")}</button>
                <button onClick={() => updateStatus(booking.id, "COMPLETED")}>{t("complete")}</button>
                {booking.customer.phone && (
                  <a className="call-link" href={`tel:${booking.customer.phone}`}>
                    {t("callUser")}
                  </a>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="card">
        <div className="btn-row">
          {!showServiceForm && services.length > 0 && (
            <button onClick={() => setShowServiceForm(true)}>{t("addNewService")}</button>
          )}
          {showServiceForm && (
            <button onClick={() => setShowServiceForm(false)}>{t("hideServiceForm")}</button>
          )}
        </div>

        {showServiceForm && (
          <form className="form-grid" onSubmit={createService}>
            <input
              placeholder={t("serviceTitle")}
              value={serviceForm.title}
              onChange={(e) => setServiceForm((p) => ({ ...p, title: e.target.value }))}
              required
            />
            <input
              placeholder={t("description")}
              value={serviceForm.description}
              onChange={(e) => setServiceForm((p) => ({ ...p, description: e.target.value }))}
              required
            />
            <input
              placeholder={t("category")}
              value={serviceForm.category}
              onChange={(e) => setServiceForm((p) => ({ ...p, category: e.target.value }))}
              required
            />
            <input
              placeholder={t("typeOfWork")}
              value={serviceForm.workType}
              onChange={(e) => setServiceForm((p) => ({ ...p, workType: e.target.value }))}
            />
            <input
              placeholder={t("city")}
              value={serviceForm.city}
              onChange={(e) => setServiceForm((p) => ({ ...p, city: e.target.value }))}
              required
            />
            <input
              placeholder={`${t("minor")} ${t("quotePrice")}`}
              type="number"
              value={serviceForm.minorPrice}
              onChange={(e) => setServiceForm((p) => ({ ...p, minorPrice: e.target.value }))}
              required
            />
            <input
              placeholder={`${t("small")} ${t("quotePrice")}`}
              type="number"
              value={serviceForm.smallPrice}
              onChange={(e) => setServiceForm((p) => ({ ...p, smallPrice: e.target.value }))}
              required
            />
            <input
              placeholder={`${t("major")} ${t("quotePrice")}`}
              type="number"
              value={serviceForm.majorPrice}
              onChange={(e) => setServiceForm((p) => ({ ...p, majorPrice: e.target.value }))}
              required
            />
            <button type="submit">{t("save")}</button>
          </form>
        )}
      </div>

      {showServiceForm && (
        <div className="grid">
          {services.map((service) => (
            <article key={service.id} className="card">
              <h4>{service.title}</h4>
              <p className="muted">{service.category}</p>
              <p className="muted">{service.workType || "-"}</p>
              <p>{t("minor")}: Rs. {service.minorPrice ?? service.price}</p>
              <p>{t("small")}: Rs. {service.smallPrice ?? service.price}</p>
              <p>{t("major")}: Rs. {service.majorPrice ?? service.price}</p>
              <p>{t("status")}: {service.isActive ? t("active") : t("inactive")}</p>
              <button onClick={() => toggleService(service.id)}>
                {service.isActive ? t("disable") : t("enable")}
              </button>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
