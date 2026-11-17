import React, { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { CinematicPreloader } from "../preloader/CinematicPreloader";
import { useAuthStore } from "../../store/auth.store";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000/api/v1";

async function fetchMeSilently(): Promise<any | null> {
  try {
    let res = await fetch(`${BASE_URL}/auth/me`, { credentials: "include", headers: { "Content-Type": "application/json" } });
    if (res.status === 401) {
      const r = await fetch(`${BASE_URL}/auth/refresh`, { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" } });
      if (r.ok) res = await fetch(`${BASE_URL}/auth/me`, { credentials: "include", headers: { "Content-Type": "application/json" } });
    }
    if (!res.ok) return null;
    const json = await res.json().catch(() => ({}));
    return json?.data?.user ?? json?.user ?? null;
  } catch {
    return null;
  }
}

export interface GameResult {
  score: number;
  xp: number;
  progress: number;
  timeTakenMs: number;
  difficulty: "EASY" | "NORMAL" | "ADVANCED";
}

class PreloaderErrorBoundary extends React.Component<{ onFallback: () => void; children: React.ReactNode }, { hasError: boolean }> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch() {
    this.props.onFallback();
  }
  render() {
    if (this.state.hasError) return null;
    return this.props.children as any;
  }
}

export function GamingExperienceGate({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [done, setDone] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const isAuthedRef = useRef(false);
  const setUser = useAuthStore((s) => s.setUser);
  const setInitialized = useAuthStore((s) => s.setInitialized);

  // Allow critical auth utility flows (email verification/reset links) to work directly.
  const isUtilityAuthPath = useMemo(() => {
    const p = location.pathname;
    return p.includes("verify-email") || p.includes("reset-password");
  }, [location.pathname]);

  // Show preloader on every refresh/load. If already authenticated, stay on current page after preloader.
  // If not authenticated, go to login page after preloader.
  const blocking = !done && !isUtilityAuthPath;

  useEffect(() => {
    if (!blocking) return;
    let cancelled = false;
    fetchMeSilently().then((u) => {
      if (cancelled) return;
      isAuthedRef.current = !!u;
      setUser(u);
      setInitialized(true);
      setAuthChecked(true);
    });
    return () => { cancelled = true; };
  }, [blocking, setUser, setInitialized]);

  if (!blocking) return <>{children}</>;

  const reveal = async () => {
    // Ensure auth check has completed so we know where to go.
    let authed = isAuthedRef.current;
    if (!authChecked) {
      const u = await fetchMeSilently();
      authed = !!u;
      isAuthedRef.current = authed;
      setUser(u);
      setInitialized(true);
      setAuthChecked(true);
    }
    if (authed) {
      setDone(true);
      return; // stay on current (refreshed) route
    }
    setDone(true);
    navigate("/login", { replace: true });
  };

  return (
    <PreloaderErrorBoundary onFallback={reveal}>
      <CinematicPreloader onComplete={reveal} />
    </PreloaderErrorBoundary>
  );
}
