import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { LoginPage } from "./LoginPage";
import { useAuthStore } from "../../store/auth.store";
import * as api from "../../services/apiClient";

vi.mock("../../services/apiClient", () => ({
  apiRequest: vi.fn(),
}));

describe("LoginPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.setState({ user: null, initialized: false });
  });

  it("submits credentials and navigates by role", async () => {
    (api.apiRequest as any).mockResolvedValue({ data: { user: { id: "1", email: "admin@x", name: "Admin", role: "ADMIN" } } });

    render(
      <MemoryRouter initialEntries={["/login"]}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/admin" element={<div>Admin Dashboard</div>} />
        </Routes>
      </MemoryRouter>
    );

    fireEvent.change(screen.getByPlaceholderText("Email"), { target: { value: "admin@teamalgebra.local" } });
    fireEvent.change(screen.getByPlaceholderText("Password"), { target: { value: "Password123!" } });
    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));

    expect(api.apiRequest).toHaveBeenCalledWith("/auth/login", expect.objectContaining({ method: "POST" }));
    expect(await screen.findByText("Admin Dashboard")).toBeInTheDocument();
    expect(useAuthStore.getState().user?.role).toBe("ADMIN");
  });

  it("shows error on failed login", async () => {
    (api.apiRequest as any).mockRejectedValue(new Error("Invalid credentials"));

    render(
      <MemoryRouter initialEntries={["/login"]}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
        </Routes>
      </MemoryRouter>
    );

    fireEvent.change(screen.getByPlaceholderText("Email"), { target: { value: "bad@x" } });
    fireEvent.change(screen.getByPlaceholderText("Password"), { target: { value: "wrong" } });
    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));

    expect(await screen.findByText("Invalid credentials")).toBeInTheDocument();
  });
});
