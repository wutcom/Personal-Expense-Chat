import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Navigation } from "@/components/layout/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { navigation } from "@/lib/navigation";

vi.mock("next/navigation", () => ({ usePathname: () => "/budgets" }));

describe("workspace navigation", () => {
  it.each(["desktop", "mobile"] as const)(
    "exposes all five routes and only the active page in %s navigation",
    (variant) => {
      render(<Navigation variant={variant} />);
      const links = screen.getAllByRole("link");
      expect(links).toHaveLength(5);
      for (const item of navigation) {
        const link = screen.getByRole("link", { name: item.label });
        expect(link).toHaveAttribute("href", item.href);
        if (item.href === "/budgets")
          expect(link).toHaveAttribute("aria-current", "page");
        else expect(link).not.toHaveAttribute("aria-current");
      }
    },
  );
  it("offers a working skip target and retains content inside the shared shell", () => {
    render(
      <AppShell>
        <h1>หน้าแผน</h1>
      </AppShell>,
    );
    expect(
      screen.getByRole("link", { name: "ข้ามไปยังเนื้อหา" }),
    ).toHaveAttribute("href", "#main-content");
    const main = screen.getByRole("main");
    expect(main).toHaveAttribute("id", "main-content");
    expect(main).toHaveAttribute("tabindex", "-1");
    expect(within(main).getByRole("heading", { level: 1 })).toHaveTextContent(
      "หน้าแผน",
    );
  });
});
