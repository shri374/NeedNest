import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function AuthPage() {
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const [isRegister, setIsRegister] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    city: "",
    phone: "",
    role: "USER"
  });

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      let loggedInUser;
      if (isRegister) {
        loggedInUser = await register({
          ...form,
          city: form.city || undefined,
          phone: form.phone || undefined
        });
      } else {
        loggedInUser = await login({ email: form.email, password: form.password });
      }
      if (loggedInUser?.role === "PROVIDER") {
        navigate("/provider");
      } else {
        navigate("/");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container">
      <h2>{isRegister ? "Create account" : "Login"}</h2>
      <form className="card form-grid" onSubmit={onSubmit}>
        {isRegister && (
          <>
            <input
              placeholder="Full name"
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              required
            />
            <select
              value={form.role}
              onChange={(e) => setForm((prev) => ({ ...prev, role: e.target.value }))}
            >
              <option value="USER">User</option>
              <option value="PROVIDER">Provider</option>
            </select>
            <input
              placeholder="City"
              value={form.city}
              onChange={(e) => setForm((prev) => ({ ...prev, city: e.target.value }))}
            />
            <input
              placeholder="Phone"
              value={form.phone}
              onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
            />
          </>
        )}

        <input
          type="email"
          placeholder="Email"
          value={form.email}
          onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={form.password}
          onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
          required
        />

        <button type="submit" disabled={loading}>
          {loading ? "Please wait..." : isRegister ? "Register" : "Login"}
        </button>

        {error && <p className="error">{error}</p>}
      </form>

      <button className="link-btn" onClick={() => setIsRegister((prev) => !prev)}>
        {isRegister ? "Already have account? Login" : "New here? Register"}
      </button>
    </div>
  );
}
