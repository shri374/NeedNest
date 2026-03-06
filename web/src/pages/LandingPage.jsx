import { useNavigate } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext";

export default function LandingPage() {
  const navigate = useNavigate();
  const { t } = useLanguage();

  return (
    <div className="container">
      <h1>{t("chooseRole")}</h1>
      <p className="muted">{t("chooseRoleHint")}</p>

      <div className="grid">
        <article className="card role-card">
          <h3>{t("user")}</h3>
          <p>{t("userRoleHint")}</p>
          <button onClick={() => navigate("/auth?role=USER")}>{t("continueAsUser")}</button>
        </article>

        <article className="card role-card">
          <h3>{t("providerRole")}</h3>
          <p>{t("providerRoleHint")}</p>
          <button onClick={() => navigate("/auth?role=PROVIDER")}>{t("continueAsProvider")}</button>
        </article>
      </div>
    </div>
  );
}
