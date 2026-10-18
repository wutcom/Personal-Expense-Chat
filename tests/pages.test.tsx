import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import ChatPage from "@/app/(app)/chat/page";
import DashboardPage from "@/app/(app)/dashboard/page";
import BudgetsPage from "@/app/(app)/budgets/page";
import HistoryPage from "@/app/(app)/history/page";
import SettingsPage from "@/app/(app)/settings/page";
import LoginPage from "@/app/(auth)/login/page";
import HomePage from "@/app/page";

const { redirect } = vi.hoisted(() => ({ redirect: vi.fn() }));
vi.mock("next/navigation", () => ({ redirect }));

describe("Phase 1 routes", () => {
  it("redirects the entry route to chat", () => {
    HomePage();
    expect(redirect).toHaveBeenCalledWith("/chat");
  });
  it.each([
    ChatPage,
    DashboardPage,
    BudgetsPage,
    HistoryPage,
    SettingsPage,
    LoginPage,
  ])("renders one clear page heading for %s", (Page) => {
    render(<Page />);
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
  });
  it("does not accept financial writes before the authenticated backend exists", () => {
    render(<ChatPage />);
    expect(screen.getByRole("textbox", { name: "ข้อความ" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "ส่งข้อความ" })).toBeDisabled();
    expect(screen.getByRole("textbox")).toHaveAccessibleDescription(
      /ยังไม่มีการบันทึกข้อมูล/,
    );
  });
  it("does not present mock financial figures as real account data", () => {
    render(<DashboardPage />);
    expect(screen.getAllByLabelText("ยังไม่มีข้อมูล")).toHaveLength(3);
  });
  it("shows a clear authentication boundary without collecting credentials", () => {
    render(<LoginPage />);
    expect(screen.getByText(/ยังไม่มีการยืนยันตัวตน/)).toBeVisible();
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /สำรวจโครงสร้างแอป/ }),
    ).toHaveAttribute("href", "/chat");
  });
});
