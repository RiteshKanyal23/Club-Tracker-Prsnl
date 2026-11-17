import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { ProtectedRoute } from "./ProtectedRoute";
import { useAuthStore } from "../store/auth.store";

vi.mock("../services/apiClient", () => ({
  apiRequest: vi.fn(() => Promise.resolve({ data: { user: null } })),
}));

function renderWithRoutes(initialPath = "/protected") {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="/login" element={<div>Login Page</div>} />
        <Route element={<ProtectedRoute />}>
          <Route path="/protected" element={<div>Secret</div>} />
        </Route>
      </Routes>
    </MemoryRouter>
  );
}

describe("ProtectedRoute", () => {
  beforeEach(() => {
    useAuthStore.setState({ user: null, initialized: false });
  });

  it("redirects unauthenticated users to login when initialized", async () => {
    useAuthStore.setState({ user: null, initialized: true });
    renderWithRoutes();
    expect(await screen.findByText("Login Page")).toBeInTheDocument();
  });

  it("renders outlet for authenticated users", async () => {
    useAuthStore.setState({ user: { id: "u1", email: "a@b.c", name: "A", role: "ADMIN" } as any, initialized: true });
    renderWithRoutes();
    expect(await screen.findByText("Secret")).toBeInTheDocument();
  });
});
