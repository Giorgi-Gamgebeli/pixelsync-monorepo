import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

vi.mock("next/navigation", () => ({
  usePathname: () => "/home",
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

import HomeNavLink from "@/app/(privateRoutes)/home/HomeNavLink";

describe("HomeNavLink", () => {
  afterEach(cleanup);

  beforeEach(() => {
    globalThis.history.replaceState(null, "", "/home");
    vi.clearAllMocks();
  });

  it("renders a link", () => {
    render(
      <HomeNavLink href="/home/friends" prefetch={() => {}}>
        Friends
      </HomeNavLink>,
    );

    expect(screen.getByText("Friends").closest("a")).toHaveAttribute(
      "href",
      "/home/friends",
    );
  });

  it("calls prefetch on hover and focus", () => {
    const prefetch = vi.fn();

    render(
      <HomeNavLink href="/home/friends" prefetch={prefetch}>
        Friends
      </HomeNavLink>,
    );

    const link = screen.getByText("Friends").closest("a");
    expect(link).not.toBeNull();

    fireEvent.mouseEnter(link as Element);
    fireEvent.focus(link as Element);

    expect(prefetch).toHaveBeenCalledTimes(2);
  });
});
