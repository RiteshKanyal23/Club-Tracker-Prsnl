import { create } from "zustand";

type User = { id: string; email: string; name: string; role: string } | null;

interface AuthState {
  user: User;
  initialized: boolean;
  setUser: (user: User) => void;
  setInitialized: (v: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  initialized: false,
  setUser: (user) => set({ user }),
  setInitialized: (initialized) => set({ initialized }),
  logout: () => set({ user: null, initialized: true }),
}));
