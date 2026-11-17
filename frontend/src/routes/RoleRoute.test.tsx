import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { RoleRoute } from "./RoleRoute";
import { useAuthStore } from "../store/auth.store";

function renderRoleRoute(roles: string[], initialPath = "/admin") {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="/" element={<div>Home</div>} />
        <Route path="/member" element={<div>Member Home</div>} />
        <Route element={<RoleRoute roles={roles} />}>
          <Route path="/admin" element={<div>Admin Area</div>} />
        </Route>
      </Routes>
    </MemoryRouter>
  );
}

describe("RoleRoute", () => {
  beforeEach(() => {
    useAuthStore.setState({ user: null, initialized: true });
  });
  afterEach(() => {
    cleanup();
  });

  it("allows users with matching role", async () => {
    useAuthStore.setState({ user: { id: "1", email: "a@a", name: "A", role: "ADMIN" } as any, initialized: true });
    renderRoleRoute(["ADMIN"]);
    expect(await screen.findByText("Admin Area")).toBeInTheDocument();
  });

  it("redirects users without matching role to their role home", async () => {
    useAuthStore.setState({ user: { id: "2", email: "m@a", name: "M", role: "MEMBER" } as any, initialized: true });
    renderRoleRoute(["ADMIN"]);
    expect(await screen.findByText("Member Home")).toBeInTheDocument();
  });
});
