import { NavLink, Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import { languageOptions, useLanguage } from "./context/LanguageContext";
import LandingPage from "./pages/LandingPage";
import HomePage from "./pages/HomePage";
import AuthPage from "./pages/AuthPage";
import BookingsPage from "./pages/BookingsPage";
import ProviderPage from "./pages/ProviderPage";
import ProtectedRoute from "./components/ProtectedRoute";

function Header() {
  const { user, logout } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const isUser = user?.role === "USER" || user?.role === "ADMIN";
  const isProvider = user?.role === "PROVIDER" || user?.role === "ADMIN";
  const roleLabel =
    user?.role === "ADMIN" ? t("adminRole") : user?.role === "PROVIDER" ? t("providerRole") : t("user");

  return (
    <header className="topbar">
      <nav>
        {!user && <NavLink to="/">{t("home")}</NavLink>}
        {!user && <NavLink to="/auth?mode=login">{t("login")}</NavLink>}
        {isUser && <NavLink to="/user-dashboard">{t("userServices")}</NavLink>}
        {isUser && <NavLink to="/bookings">{t("userBookings")}</NavLink>}
        {isProvider && <NavLink to="/provider-dashboard">{t("providerShop")}</NavLink>}
        {user && <button onClick={logout}>{t("logout")}</button>}
      </nav>
      <div className="topbar-right">
        <label className="lang-label">
          {t("language")}
          <select value={language} onChange={(e) => setLanguage(e.target.value)}>
            {languageOptions.map((option) => (
              <option value={option.code} key={option.code}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <div className="user-chip">{user ? `${user.name} (${roleLabel})` : t("guest")}</div>
      </div>
    </header>
  );
}

export default function App() {
  const { user } = useAuth();

  return (
    <>
      <Header />
      <Routes>
        <Route
          path="/"
          element={
            user ? (
              <Navigate
                to={user.role === "PROVIDER" || user.role === "ADMIN" ? "/provider-dashboard" : "/user-dashboard"}
                replace
              />
            ) : (
              <LandingPage />
            )
          }
        />
        <Route path="/auth" element={<AuthPage />} />
        <Route
          path="/user-dashboard"
          element={
            <ProtectedRoute roles={["USER", "ADMIN"]}>
              <HomePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/bookings"
          element={
            <ProtectedRoute roles={["USER", "ADMIN"]}>
              <BookingsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/provider-dashboard"
          element={
            <ProtectedRoute roles={["PROVIDER", "ADMIN"]}>
              <ProviderPage />
            </ProtectedRoute>
          }
        />
      </Routes>
    </>
  );
}
