import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { useAuthStore } from "../store/auth.store";
import { apiRequest } from "../services/apiClient";

export function ProtectedRoute() {
  const user = useAuthStore((s) => s.user);
  const initialized = useAuthStore((s) => s.initialized);
  const setUser = useAuthStore((s) => s.setUser);
  const setInitialized = useAuthStore((s) => s.setInitialized);
  const location = useLocation();

  useEffect(() => {
    if (initialized) return;
    apiRequest<any>("/auth/me")
      .then((res) => setUser(res.data?.user ?? null))
      .catch(() => setUser(null))
      .finally(() => setInitialized(true));
  }, [initialized, setUser, setInitialized]);

  if (!initialized) return <div className="min-h-screen flex items-center justify-center bg-midnight text-slate-300">Loading session...</div>;
  if (!user) {
    const p = location.pathname;
    const loginPath = p.startsWith("/admin") ? "/admin/login" : p.startsWith("/member") ? "/member/login" : "/login";
    return <Navigate to={loginPath} replace />;
  }
  return <Outlet />;
}
