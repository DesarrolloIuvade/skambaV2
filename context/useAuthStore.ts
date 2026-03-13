import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface User {
  usu_ide: number;
  usu_nom: string;
  usu_ema: string;
  per_ide: number;
  [key: string]: any;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isHydrated: boolean;
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  setHydrated: (state: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isHydrated: false,
      setUser: (user) => set({ user }),
      setToken: (token) => set({ token }),
      setHydrated: (isHydrated) => set({ isHydrated }),
      logout: () => set({ user: null, token: null }),
    }),
    {
      name: 'kamba-auth-storage',
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
    }
  )
);
