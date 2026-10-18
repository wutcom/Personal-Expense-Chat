import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ChatPage from "@/app/(app)/chat/page";
import DashboardPage from "@/app/(app)/dashboard/page";
import BudgetsPage from "@/app/(app)/budgets/page";
import HistoryPage from "@/app/(app)/history/page";
import SettingsPage from "@/app/(app)/settings/page";
import LoginPage from "@/app/(auth)/login/page";
import HomePage from "@/app/page";
const { redirect, requireUser, getAuthenticatedSession } = vi.hoisted(() => ({
  redirect: vi.fn(),
  requireUser: vi.fn(),
  getAuthenticatedSession: vi.fn(),
}));
vi.mock("next/navigation", () => ({ redirect }));
vi.mock("@/lib/auth/session", () => ({ requireUser, getAuthenticatedSession }));
vi.mock("@/app/(auth)/actions", () => ({
  authenticate: vi.fn(),
  signOut: vi.fn(),
}));
beforeEach(() => {
  vi.clearAllMocks();
  requireUser.mockResolvedValue({ user: { id: "A", email: "a@example.com" } });
  getAuthenticatedSession.mockResolvedValue({ status: "unconfigured" });
});
describe("workspace routes", () => {
  it("redirects root to chat", () => {
    HomePage();
    expect(redirect).toHaveBeenCalledWith("/chat");
  });
  it.each([ChatPage, DashboardPage, BudgetsPage, HistoryPage])(
    "requires a server-validated identity before rendering %s",
    async (Page) => {
      render(await Page());
      expect(requireUser).toHaveBeenCalledOnce();
      expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    },
  );
  it("keeps financial writes disabled until execution is implemented", async () => {
    render(await ChatPage());
    expect(screen.getByRole("textbox", { name: "ข้อความ" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "ส่งข้อความ" })).toBeDisabled();
  });
  it("shows unknown balances", async () => {
    render(await DashboardPage());
    expect(screen.getAllByLabelText("ยังไม่มีข้อมูล")).toHaveLength(3);
  });
  it("shows only the authenticated account email and sign-out form", async () => {
    render(await SettingsPage({ searchParams: Promise.resolve({}) }));
    expect(screen.getByText("a@example.com")).toBeVisible();
    expect(screen.getByRole("button", { name: "ออกจากระบบ" })).toBeVisible();
  });
  it("does not collect credentials if Supabase configuration is missing", async () => {
    render(await LoginPage({ searchParams: Promise.resolve({}) }));
    expect(screen.getByRole("status")).toHaveTextContent("ยังไม่ได้ตั้งค่า");
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
  });
  it("shows sign-in fields when configured", async () => {
    getAuthenticatedSession.mockResolvedValue({ status: "unauthenticated" });
    render(await LoginPage({ searchParams: Promise.resolve({}) }));
    expect(screen.getByRole("textbox", { name: "อีเมล" })).toBeRequired();
    expect(screen.getByLabelText("รหัสผ่าน")).toHaveAttribute(
      "autocomplete",
      "current-password",
    );
  });
});
