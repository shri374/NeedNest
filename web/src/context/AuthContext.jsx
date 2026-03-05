import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { api } from "../lib/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("neednest_token");
    if (!token) {
      setLoading(false);
      return;
    }

    api
      .me()
      .then((data) => setUser(data))
      .catch(() => {
        localStorage.removeItem("neednest_token");
      })
      .finally(() => setLoading(false));
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      async register(payload) {
        const data = await api.register(payload);
        localStorage.setItem("neednest_token", data.token);
        setUser(data.user);
        return data.user;
      },
      async login(payload) {
        const data = await api.login(payload);
        localStorage.setItem("neednest_token", data.token);
        setUser(data.user);
        return data.user;
      },
      logout() {
        localStorage.removeItem("neednest_token");
        setUser(null);
      }
    }),
    [user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return ctx;
}
