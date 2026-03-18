import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

vi.mock("next/navigation", () => ({
  usePathname: () => "/home",
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
  Link: ({
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
  redirect: vi.fn(),
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

vi.mock("@/app/_lib/chatCache", () => ({
  fetchDM: vi.fn(),
  fetchGroup: vi.fn(),
  getDMCache: vi.fn(() => undefined),
  getGroupCache: vi.fn(() => undefined),
}));

vi.mock("@/app/_components/ClientIcon", () => ({
  default: ({ icon }: { icon: string }) => <span>{icon}</span>,
}));

import {
  ChatRouterProvider,
  useChatRouter,
  type SelectedChat,
} from "@/app/(protectedRoutes)/home/ChatRouterContext";
import ChatRouter from "@/app/(protectedRoutes)/home/ChatRouter";
import HomeNavLink from "@/app/(protectedRoutes)/home/HomeNavLink";
import { fetchDM, fetchGroup } from "@/app/_lib/chatCache";

function renderShell(
  fallback: React.ReactNode = <div data-testid="empty">empty state</div>,
) {
  return render(
    <ChatRouterProvider>
      <ChatRouter>{fallback}</ChatRouter>
    </ChatRouterProvider>,
  );
}

function SelectChatButton({ chat }: { chat: NonNullable<SelectedChat> }) {
  const { selectChat } = useChatRouter();
  return (
    <button data-testid="select" onClick={() => selectChat(chat)}>
      select
    </button>
  );
}

function ClearChatButton() {
  const { clearChat } = useChatRouter();
  return (
    <button data-testid="clear" onClick={() => clearChat()}>
      clear
    </button>
  );
}

describe("Chat Routing", () => {
  afterEach(cleanup);

  beforeEach(() => {
    window.history.replaceState(null, "", "/home");
    vi.clearAllMocks();
  });

  // ── 1. Empty state ──────────────────────────────────────────────

  describe("empty state", () => {
    it("renders fallback content when no chat is selected", async () => {
      renderShell();

      await act(() => Promise.resolve());

      expect(screen.getByTestId("empty")).toBeInTheDocument();
      expect(screen.queryByTestId("dm-view")).not.toBeInTheDocument();
      expect(screen.queryByTestId("group-view")).not.toBeInTheDocument();
    });
  });

  // ── 2–3. Sidebar click → switches chat + updates URL ───────────

  describe("chat selection", () => {
    it("selectChat renders DM view and pushes URL with ?dm=", async () => {
      const pushStateSpy = vi.spyOn(window.history, "pushState");

      render(
        <ChatRouterProvider>
          <SelectChatButton chat={{ type: "dm", friendId: "alice-123" }} />
          <ChatRouter>
            <div data-testid="empty">empty</div>
          </ChatRouter>
        </ChatRouterProvider>,
      );

      await act(() => Promise.resolve());
      await userEvent.click(screen.getByTestId("select"));

      expect(screen.getByTestId("dm-view")).toHaveTextContent("dm:alice-123");
      expect(screen.queryByTestId("empty")).not.toBeInTheDocument();
      expect(pushStateSpy).toHaveBeenCalledWith({}, "", "/home?dm=alice-123");
    });

    it("selectChat renders group view and pushes URL with ?group=", async () => {
      const pushStateSpy = vi.spyOn(window.history, "pushState");

      render(
        <ChatRouterProvider>
          <SelectChatButton chat={{ type: "group", groupId: 42 }} />
          <ChatRouter>
            <div data-testid="empty">empty</div>
          </ChatRouter>
        </ChatRouterProvider>,
      );

      await act(() => Promise.resolve());
      await userEvent.click(screen.getByTestId("select"));

      expect(screen.getByTestId("group-view")).toHaveTextContent("group:42");
      expect(screen.queryByTestId("empty")).not.toBeInTheDocument();
      expect(pushStateSpy).toHaveBeenCalledWith({}, "", "/home?group=42");
    });

    it("selectChat eagerly prefetches data", async () => {
      render(
        <ChatRouterProvider>
          <SelectChatButton chat={{ type: "dm", friendId: "bob" }} />
          <ChatRouter>
            <div>empty</div>
          </ChatRouter>
        </ChatRouterProvider>,
      );

      await act(() => Promise.resolve());
      await userEvent.click(screen.getByTestId("select"));

      expect(fetchDM).toHaveBeenCalledWith("bob");
    });
  });

  // ── 4–5. Refresh restores chat from URL ─────────────────────────

  describe("URL initialization", () => {
    it("initializes DM from ?dm= query param on mount", async () => {
      window.history.replaceState(null, "", "/home?dm=carol-456");

      renderShell();
      await act(() => Promise.resolve());

      expect(screen.getByTestId("dm-view")).toHaveTextContent("dm:carol-456");
    });

    it("initializes group from ?group= query param on mount", async () => {
      window.history.replaceState(null, "", "/home?group=99");

      renderShell();
      await act(() => Promise.resolve());

      expect(screen.getByTestId("group-view")).toHaveTextContent("group:99");
    });

    it("shows fallback when URL has no chat params", async () => {
      window.history.replaceState(null, "", "/home");

      renderShell();
      await act(() => Promise.resolve());

      expect(screen.getByTestId("empty")).toBeInTheDocument();
    });
  });

  // ── 6. Browser back/forward via popstate ────────────────────────

  describe("browser navigation", () => {
    it("popstate with ?dm= shows DM view", async () => {
      renderShell();
      await act(() => Promise.resolve());

      await act(() => {
        window.history.replaceState(null, "", "/home?dm=dave-789");
        window.dispatchEvent(new PopStateEvent("popstate"));
      });

      expect(screen.getByTestId("dm-view")).toHaveTextContent("dm:dave-789");
    });

    it("popstate with ?group= shows group view", async () => {
      renderShell();
      await act(() => Promise.resolve());

      await act(() => {
        window.history.replaceState(null, "", "/home?group=7");
        window.dispatchEvent(new PopStateEvent("popstate"));
      });

      expect(screen.getByTestId("group-view")).toHaveTextContent("group:7");
    });

    it("popstate with no params shows fallback", async () => {
      window.history.replaceState(null, "", "/home?dm=someone");
      renderShell();
      await act(() => Promise.resolve());
      expect(screen.getByTestId("dm-view")).toBeInTheDocument();

      await act(() => {
        window.history.replaceState(null, "", "/home");
        window.dispatchEvent(new PopStateEvent("popstate"));
      });

      expect(screen.getByTestId("empty")).toBeInTheDocument();
      expect(screen.queryByTestId("dm-view")).not.toBeInTheDocument();
    });

    it("popstate prefetches data for the target chat", async () => {
      renderShell();
      await act(() => Promise.resolve());

      vi.clearAllMocks();

      await act(() => {
        window.history.replaceState(null, "", "/home?group=55");
        window.dispatchEvent(new PopStateEvent("popstate"));
      });

      expect(fetchGroup).toHaveBeenCalledWith(55);
    });
  });

  // ── 7–8. Old deep link redirects ────────────────────────────────

  describe("compatibility redirects", () => {
    it("/home/[friendId] redirects to /home?dm=<friendId>", async () => {
      const { redirect } = await import("next/navigation");
      const Page = (
        await import("@/app/(protectedRoutes)/home/[friendID]/page")
      ).default;

      await Page({ params: Promise.resolve({ friendID: "legacy-user" }) });

      expect(redirect).toHaveBeenCalledWith("/home?dm=legacy-user");
    });

    it("/home/group/[groupId] redirects to /home?group=<groupId>", async () => {
      const { redirect } = await import("next/navigation");
      const Page = (
        await import("@/app/(protectedRoutes)/home/group/[groupId]/page")
      ).default;

      await Page({ params: Promise.resolve({ groupId: "77" }) });

      expect(redirect).toHaveBeenCalledWith("/home?group=77");
    });
  });

  // ── 9. clearChat / Friends page ─────────────────────────────────

  describe("clearChat", () => {
    it("clearing chat shows fallback content", async () => {
      window.history.replaceState(null, "", "/home?dm=someone");

      render(
        <ChatRouterProvider>
          <ClearChatButton />
          <ChatRouter>
            <div data-testid="friends-page">friends page</div>
          </ChatRouter>
        </ChatRouterProvider>,
      );

      await act(() => Promise.resolve());
      expect(screen.getByTestId("dm-view")).toBeInTheDocument();

      await userEvent.click(screen.getByTestId("clear"));

      expect(screen.getByTestId("friends-page")).toBeInTheDocument();
      expect(screen.queryByTestId("dm-view")).not.toBeInTheDocument();
    });
  });

  // ── 10. HomeNavLink integration ─────────────────────────────────

  describe("HomeNavLink", () => {
    it("chat link calls selectChat instead of navigating", async () => {
      const pushStateSpy = vi.spyOn(window.history, "pushState");

      render(
        <ChatRouterProvider>
          <HomeNavLink chatView={{ type: "dm", friendId: "nav-test" }}>
            Alice
          </HomeNavLink>
          <ChatRouter>
            <div data-testid="empty">empty</div>
          </ChatRouter>
        </ChatRouterProvider>,
      );

      await act(() => Promise.resolve());
      await userEvent.click(screen.getByText("Alice"));

      expect(screen.getByTestId("dm-view")).toHaveTextContent("dm:nav-test");
      expect(pushStateSpy).toHaveBeenCalledWith({}, "", "/home?dm=nav-test");
    });

    it("chat link has correct href for right-click / open-in-new-tab", async () => {
      render(
        <ChatRouterProvider>
          <HomeNavLink chatView={{ type: "group", groupId: 10 }}>
            Team Chat
          </HomeNavLink>
        </ChatRouterProvider>,
      );

      await act(() => Promise.resolve());

      const link = screen.getByText("Team Chat").closest("a");
      expect(link).toHaveAttribute("href", "/home?group=10");
    });

    it("non-chat link uses regular anchor and clears selected chat", async () => {
      window.history.replaceState(null, "", "/home?dm=someone");

      render(
        <ChatRouterProvider>
          <HomeNavLink href="/home/friends">Friends</HomeNavLink>
          <ChatRouter>
            <div data-testid="fallback">fallback</div>
          </ChatRouter>
        </ChatRouterProvider>,
      );

      await act(() => Promise.resolve());
      expect(screen.getByTestId("dm-view")).toBeInTheDocument();

      await userEvent.click(screen.getByText("Friends"));

      expect(screen.getByTestId("fallback")).toBeInTheDocument();
      expect(screen.queryByTestId("dm-view")).not.toBeInTheDocument();
    });
  });
});
