import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuthStore } from "../store/auth.store";

export function roleHome(role?: string) {
  if (role === "CEO") return "/ceo";
  if (role === "ADMIN") return "/admin";
  if (role === "COORDINATOR") return "/coordinator";
  if (role === "PROJECT_MANAGER") return "/project-manager";
  if (role === "TEAM_LEADER") return "/team-leader";
  if (role === "MEMBER") return "/member";
  return "/";
}

export function RoleRoute({ roles }: { roles: string[] }) {
  const role = useAuthStore((s) => s.user?.role);
  const location = useLocation();
  if (!role || !roles.includes(role)) {
    // prevent cross-portal access; send to role home or appropriate login context
    if (role) return <Navigate to={roleHome(role)} replace />;
    const p = location.pathname;
    const loginPath = p.startsWith("/admin") ? "/admin/login" : p.startsWith("/member") ? "/member/login" : p.startsWith("/ceo") ? "/ceo/login" : "/login";
    return <Navigate to={loginPath} replace />;
  }
  return <Outlet />;
}
