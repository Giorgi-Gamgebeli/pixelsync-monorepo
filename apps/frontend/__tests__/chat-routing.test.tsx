import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";

vi.mock("next/navigation", () => ({
  usePathname: () => "/home",
}));

vi.mock("@tanstack/react-query", () => ({
  useQueryClient: () => ({
    prefetchQuery: vi.fn(),
  }),
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

vi.mock("@/app/_lib/chatQueries", () => ({
  useDMChatQuery: vi.fn(),
  useGroupChatQuery: vi.fn(() => ({
    data: {
      session: {
        user: {
          id: "current-user",
          avatarConfig: null,
          userName: "Current User",
          name: "Current User",
          email: "current@test.com",
          status: "ONLINE",
        },
      },
      group: {
        id: 77,
        name: "Legacy Group",
        ownerId: "current-user",
        members: [],
      },
      currentUserAvatarConfig: null,
      messages: [],
    },
    error: null,
    isPending: false,
  })),
  prefetchDMChat: vi.fn(),
  prefetchGroupChat: vi.fn(),
}));

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
});
