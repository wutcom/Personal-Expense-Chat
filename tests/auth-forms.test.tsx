import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AuthForm } from "@/components/auth/auth-form";
vi.mock("@/app/(auth)/actions", () => ({ authenticate: vi.fn() }));
describe("auth form modes", () => {
  it("changes accessible fields between sign-in, signup and recovery", () => {
    render(<AuthForm />);
    expect(screen.getByLabelText("รหัสผ่าน")).toHaveAttribute(
      "autocomplete",
      "current-password",
    );
    fireEvent.click(
      screen.getByRole("button", { name: "สมัครสมาชิก", pressed: false }),
    );
    expect(screen.getByLabelText("รหัสผ่าน")).toHaveAttribute(
      "autocomplete",
      "new-password",
    );
    expect(screen.getByLabelText("รหัสผ่าน")).toHaveAttribute("minlength", "8");
    fireEvent.click(screen.getByRole("button", { name: "ลืมรหัสผ่าน" }));
    expect(screen.queryByLabelText("รหัสผ่าน")).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "ส่งลิงก์ตั้งรหัสผ่านใหม่" }),
    ).toBeEnabled();
    expect(screen.getByRole("textbox", { name: "อีเมล" })).toBeRequired();
  });
});
