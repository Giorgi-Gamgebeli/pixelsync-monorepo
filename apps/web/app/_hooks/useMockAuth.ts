import { create } from "zustand";
import { persist } from "zustand/middleware";

interface MockUser {
  id: number;
  email: string;
  userName: string;
  firstName: string;
  lastName: string;
  avatar: string;
}

const mockUsers: MockUser[] = [
  {
    id: 1,
    email: "john@test.com",
    userName: "john_doe",
    firstName: "John",
    lastName: "Doe",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=John",
  },
  {
    id: 2,
    email: "jane@test.com",
    userName: "jane_doe",
    firstName: "Jane",
    lastName: "Doe",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Jane",
  },
  {
    id: 3,
    email: "bob@test.com",
    userName: "bob_smith",
    firstName: "Bob",
    lastName: "Smith",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Bob",
  },
];

interface MockAuthStore {
  user: MockUser | null;
  users: MockUser[];
  login: (userId: number) => void;
  logout: () => void;
}

export const useMockAuth = create<MockAuthStore>()(
  persist(
    (set) => ({
      user: null,
      users: mockUsers,
      login: (userId: number) => {
        const user = mockUsers.find((u) => u.id === userId) || null;
        set({ user });
      },
      logout: () => set({ user: null }),
    }),
    {
      name: "mock-auth-storage",
    },
  ),
);
