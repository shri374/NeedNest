import { useEffect, useState } from "react";
import { api } from "../lib/api";

export default function ProviderPage() {
  const [bookings, setBookings] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [shopMessage, setShopMessage] = useState("");

  const [shopForm, setShopForm] = useState({
    shopName: "",
    shopDescription: "",
    shopAddress: "",
    city: "",
    phone: ""
  });

  const [serviceForm, setServiceForm] = useState({
    title: "",
    description: "",
    category: "",
    city: "",
    price: "",
    imageUrl: ""
  });

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
        city: shop.city || "",
        phone: shop.phone || ""
      });
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
        city: shopForm.city || undefined,
        phone: shopForm.phone || undefined
      });
      setShopMessage("Shop profile saved.");
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
        price: Number(serviceForm.price),
        imageUrl: serviceForm.imageUrl || undefined
      });
      setServiceForm({
        title: "",
        description: "",
        category: "",
        city: "",
        price: "",
        imageUrl: ""
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
      <h2>Provider Shop Dashboard</h2>
      {loading && <p>Loading...</p>}
      {error && <p className="error">{error}</p>}

      <form className="card form-grid" onSubmit={saveShopProfile}>
        <h3>Shop Details</h3>
        <input
          placeholder="Shop name"
          value={shopForm.shopName}
          onChange={(e) => setShopForm((p) => ({ ...p, shopName: e.target.value }))}
          required
        />
        <input
          placeholder="Shop description"
          value={shopForm.shopDescription}
          onChange={(e) => setShopForm((p) => ({ ...p, shopDescription: e.target.value }))}
        />
        <input
          placeholder="Shop address"
          value={shopForm.shopAddress}
          onChange={(e) => setShopForm((p) => ({ ...p, shopAddress: e.target.value }))}
        />
        <input
          placeholder="City"
          value={shopForm.city}
          onChange={(e) => setShopForm((p) => ({ ...p, city: e.target.value }))}
        />
        <input
          placeholder="Phone"
          value={shopForm.phone}
          onChange={(e) => setShopForm((p) => ({ ...p, phone: e.target.value }))}
        />
        <button type="submit">Save Shop Profile</button>
        {shopMessage && <p className="success">{shopMessage}</p>}
      </form>

      <form className="card form-grid" onSubmit={createService}>
        <h3>Add Service</h3>
        <input
          placeholder="Service title"
          value={serviceForm.title}
          onChange={(e) => setServiceForm((p) => ({ ...p, title: e.target.value }))}
          required
        />
        <input
          placeholder="Description"
          value={serviceForm.description}
          onChange={(e) => setServiceForm((p) => ({ ...p, description: e.target.value }))}
          required
        />
        <input
          placeholder="Category (Cleaning, Electrical, Plumbing)"
          value={serviceForm.category}
          onChange={(e) => setServiceForm((p) => ({ ...p, category: e.target.value }))}
          required
        />
        <input
          placeholder="City"
          value={serviceForm.city}
          onChange={(e) => setServiceForm((p) => ({ ...p, city: e.target.value }))}
          required
        />
        <input
          placeholder="Price"
          type="number"
          value={serviceForm.price}
          onChange={(e) => setServiceForm((p) => ({ ...p, price: e.target.value }))}
          required
        />
        <input
          placeholder="Image URL"
          value={serviceForm.imageUrl}
          onChange={(e) => setServiceForm((p) => ({ ...p, imageUrl: e.target.value }))}
        />
        <button type="submit">Create Service</button>
      </form>

      <h3>Incoming Requests</h3>
      <div className="grid">
        {bookings.map((booking) => (
          <article key={booking.id} className="card">
            <h4>{booking.service.title}</h4>
            <p>Customer: {booking.customer.name}</p>
            <p>Status: {booking.status}</p>
            <p>Scheduled: {new Date(booking.scheduledAt).toLocaleString()}</p>
            <div className="btn-row">
              <button onClick={() => updateStatus(booking.id, "ACCEPTED")}>Accept</button>
              <button onClick={() => updateStatus(booking.id, "COMPLETED")}>Complete</button>
              <button onClick={() => updateStatus(booking.id, "CANCELLED")}>Cancel</button>
            </div>
          </article>
        ))}
      </div>

      <h3>Manage Services</h3>
      <div className="grid">
        {services.map((service) => (
          <article key={service.id} className="card">
            <h4>{service.title}</h4>
            <p className="muted">{service.category}</p>
            <p className="muted">{service.city}</p>
            <p>Status: {service.isActive ? "Active" : "Inactive"}</p>
            <button onClick={() => toggleService(service.id)}>
              {service.isActive ? "Disable" : "Enable"}
            </button>
          </article>
        ))}
      </div>
    </div>
  );
}
