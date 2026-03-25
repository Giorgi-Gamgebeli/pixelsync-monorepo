import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";

vi.mock("next/navigation", () => ({
  usePathname: () => "/home",
  useRouter: () => ({
    replace: vi.fn(),
    push: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
  }),
  redirect: vi.fn(),
}));

vi.mock("next-auth", () => ({
  default: vi.fn(() => ({
    handlers: {
      GET: vi.fn(),
      POST: vi.fn(),
    },
    signIn: vi.fn(),
    signOut: vi.fn(),
    auth: vi.fn(),
  })),
}));

vi.mock("next-auth/providers/credentials", () => ({
  default: vi.fn(() => ({ id: "credentials" })),
}));

vi.mock("@auth/prisma-adapter", () => ({
  PrismaAdapter: vi.fn(),
}));

vi.mock("@/auth", () => ({
  auth: vi.fn(async () => ({
    user: {
      id: "current-user",
      avatarConfig: null,
      userName: "Current User",
      name: "Current User",
      email: "current@test.com",
      status: "ONLINE",
    },
  })),
}));

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    ...props
  }: {
    children: React.ReactNode;
    href: string;
    [key: string]: unknown;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("@/app/(protectedRoutes)/home/[friendID]/DMChatView", () => ({
  default: ({ friendId }: { friendId: string }) => (
    <div data-testid="dm-view">dm:{friendId}</div>
  ),
}));

vi.mock("@/app/(protectedRoutes)/home/group/[groupId]/GroupChatView", () => ({
  default: ({ groupId }: { groupId: number }) => (
    <div data-testid="group-view">group:{groupId}</div>
  ),
}));

vi.mock(
  "@/app/(protectedRoutes)/home/[friendID]/getCachedDMChatPageData",
  () => ({
    getCachedDMChatPageData: vi.fn(async (friendId: string) => ({
      friend: {
        id: friendId,
        userName: "Legacy User",
        status: "ONLINE",
        avatarConfig: null,
      },
      messages: [],
    })),
  }),
);

import HomeNavLink from "@/app/(protectedRoutes)/home/HomeNavLink";

describe("chat routing", () => {
  afterEach(cleanup);

  beforeEach(() => {
    window.history.replaceState(null, "", "/home");
    vi.clearAllMocks();
  });

  it("builds a DM route for chat links", () => {
    render(
      <HomeNavLink chatView={{ type: "dm", friendId: "alice-123" }}>
        Alice
      </HomeNavLink>,
    );

    expect(screen.getByText("Alice").closest("a")).toHaveAttribute(
      "href",
      "/home/alice-123",
    );
  });

  it("builds a group route for chat links", () => {
    render(
      <HomeNavLink chatView={{ type: "group", groupId: 42 }}>
        Team Chat
      </HomeNavLink>,
    );

    expect(screen.getByText("Team Chat").closest("a")).toHaveAttribute(
      "href",
      "/home/group/42",
    );
  });

  it("builds the friends route for the static nav item", () => {
    render(<HomeNavLink href="/home/friends">Friends</HomeNavLink>);

    expect(screen.getByText("Friends").closest("a")).toHaveAttribute(
      "href",
      "/home/friends",
    );
  });

  it("renders the DM page directly from the dynamic route param", async () => {
    const Page = (await import("@/app/(protectedRoutes)/home/[friendID]/page"))
      .default;

    render(
      await Page({ params: Promise.resolve({ friendID: "legacy-user" }) }),
    );

    expect(screen.getByTestId("dm-view")).toHaveTextContent("dm:legacy-user");
  });

  it("renders the group page directly from the dynamic route param", async () => {
    const Page = (
      await import("@/app/(protectedRoutes)/home/group/[groupId]/page")
    ).default;

    render(await Page({ params: Promise.resolve({ groupId: "77" }) }));

    expect(screen.getByTestId("group-view")).toHaveTextContent("group:77");
  });
});
