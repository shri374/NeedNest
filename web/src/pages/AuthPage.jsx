import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";

export default function AuthPage() {
  const { login, register } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const roleFromQuery = searchParams.get("role") === "PROVIDER" ? "PROVIDER" : "USER";
  const modeFromQuery = searchParams.get("mode") === "register";

  const [isRegister, setIsRegister] = useState(modeFromQuery);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    city: "",
    phone: "",
    role: roleFromQuery
  });

  useEffect(() => {
    setForm((prev) => ({ ...prev, role: roleFromQuery }));
  }, [roleFromQuery]);

  useEffect(() => {
    setIsRegister(modeFromQuery);
  }, [modeFromQuery]);

  function toggleAuthMode() {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set("mode", isRegister ? "login" : "register");
      if (!next.get("role")) next.set("role", roleFromQuery);
      return next;
    });
  }

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
        navigate("/provider-dashboard");
      } else {
        navigate("/user-dashboard");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container">
      <h2>{isRegister ? t("createAccount") : t("login")}</h2>
      <form className="card form-grid" onSubmit={onSubmit}>
        {isRegister && (
          <>
            <input
              placeholder={t("fullName")}
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              required
            />
            <select
              value={form.role}
              onChange={(e) => setForm((prev) => ({ ...prev, role: e.target.value }))}
            >
              <option value="USER">{t("user")}</option>
              <option value="PROVIDER">{t("providerRole")}</option>
            </select>
            <input
              placeholder={t("city")}
              value={form.city}
              onChange={(e) => setForm((prev) => ({ ...prev, city: e.target.value }))}
            />
            <input
              placeholder={t("phone")}
              value={form.phone}
              onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
            />
          </>
        )}

        <input
          type="email"
          placeholder={t("email")}
          value={form.email}
          onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
          required
        />
        <input
          type="password"
          placeholder={t("password")}
          value={form.password}
          onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
          required
        />

        <button type="submit" disabled={loading}>
          {loading ? t("pleaseWait") : isRegister ? t("createAccount") : t("login")}
        </button>

        {error && <p className="error">{error}</p>}
      </form>

      <button className="link-btn" onClick={toggleAuthMode}>
        {isRegister ? t("alreadyHaveAccount") : t("newHereRegister")}
      </button>
    </div>
  );
}
