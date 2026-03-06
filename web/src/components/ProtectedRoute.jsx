import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";

export default function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth();
  const { t } = useLanguage();

  if (loading) {
    return <p className="container">{t("checkingSession")}</p>;
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
}
