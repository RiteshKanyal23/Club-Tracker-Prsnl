import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "./App";
import { Providers } from "./providers";
import "../styles/index.css";

class RootErrorBoundary extends React.Component<{ children: React.ReactNode }, { error: any }> {
  constructor(props: any) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error: any) {
    return { error };
  }
  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 24, color: "#fff", background: "#080d1b", minHeight: "100vh", fontFamily: "ui-sans-serif, system-ui" }}>
          <h1 style={{ fontSize: 20, marginBottom: 12 }}>Application error</h1>
          <pre style={{ whiteSpace: "pre-wrap", color: "#fca5a5" }}>{String(this.state.error?.stack || this.state.error?.message || this.state.error)}</pre>
          <button onClick={() => { sessionStorage.setItem("tact_gaming_experience_done", "1"); window.location.href = "/login"; }} style={{ marginTop: 16, padding: "10px 14px", borderRadius: 8 }}>
            Continue to Login
          </button>
        </div>
      );
    }
    return this.props.children as any;
  }
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <RootErrorBoundary>
      <Providers>
        <App />
      </Providers>
    </RootErrorBoundary>
  </React.StrictMode>
);
