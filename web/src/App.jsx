import { NavLink, Route, Routes } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import HomePage from "./pages/HomePage";
import AuthPage from "./pages/AuthPage";
import BookingsPage from "./pages/BookingsPage";
import ProviderPage from "./pages/ProviderPage";
import ProtectedRoute from "./components/ProtectedRoute";

function Header() {
  const { user, logout } = useAuth();
  const isUser = user?.role === "USER" || user?.role === "ADMIN";
  const isProvider = user?.role === "PROVIDER" || user?.role === "ADMIN";

  return (
    <header className="topbar">
      <nav>
        <NavLink to="/">User Services</NavLink>
        {isUser && <NavLink to="/bookings">User Bookings</NavLink>}
        {isProvider && <NavLink to="/provider">Provider Shop</NavLink>}
        {!user ? <NavLink to="/auth">Login</NavLink> : <button onClick={logout}>Logout</button>}
      </nav>
      <div className="user-chip">{user ? `${user.name} (${user.role})` : "Guest"}</div>
    </header>
  );
}

export default function App() {
  return (
    <>
      <Header />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route
          path="/bookings"
          element={
            <ProtectedRoute roles={["USER", "ADMIN"]}>
              <BookingsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/provider"
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
