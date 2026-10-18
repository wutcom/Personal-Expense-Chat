"use server";

import { redirect } from "next/navigation";
import { getSiteOrigin } from "@/lib/auth/site-url";
import { createClient } from "@/lib/supabase/server";
import { getAuthenticatedSession } from "@/lib/auth/session";
import { authSchema, newPasswordSchema } from "@/lib/validation/auth";
import type { AuthState } from "@/types/auth";

const unavailable: AuthState = {
  status: "error",
  message: "ไม่สามารถเชื่อมต่อระบบบัญชีได้ กรุณาลองใหม่",
};
export async function authenticate(
  _state: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const parsed = authSchema.safeParse({
    intent: formData.get("intent"),
    email:
      typeof formData.get("email") === "string"
        ? String(formData.get("email")).trim()
        : "",
    password: formData.get("password"),
  });
  if (!parsed.success)
    return {
      status: "error",
      message: "กรุณาตรวจสอบอีเมลและรหัสผ่าน (สมัครใหม่อย่างน้อย 8 ตัวอักษร)",
    };
  const supabase = await createClient();
  if (!supabase) return unavailable;
  const input = parsed.data;
  try {
    if (input.intent === "signin") {
      const { error } = await supabase.auth.signInWithPassword({
        email: input.email,
        password: input.password,
      });
      if (error)
        return {
          status: "error",
          message: "เข้าสู่ระบบไม่สำเร็จ กรุณาตรวจสอบข้อมูลและยืนยันอีเมล",
        };
    } else {
      const origin = getSiteOrigin();
      if (!origin) return unavailable;
      if (input.intent === "reset") {
        const { error } = await supabase.auth.resetPasswordForEmail(
          input.email,
          { redirectTo: `${origin}/auth/callback?flow=recovery` },
        );
        if (error) return unavailable;
        return {
          status: "success",
          message:
            "หากอีเมลนี้มีบัญชี คุณจะได้รับลิงก์ตั้งรหัสผ่านใหม่ กรุณาตรวจสอบกล่องจดหมาย",
        };
      }
      const { data, error } = await supabase.auth.signUp({
        email: input.email,
        password: input.password,
        options: { emailRedirectTo: `${origin}/auth/callback` },
      });
      if (error)
        return {
          status: "error",
          message: "สมัครสมาชิกไม่สำเร็จ กรุณาลองใหม่หรือติดต่อผู้ดูแล",
        };
      if (!data.session)
        return {
          status: "success",
          message:
            "กรุณาตรวจสอบอีเมลเพื่อยืนยันบัญชี หากเคยสมัครแล้วให้เข้าสู่ระบบหรือรีเซ็ตรหัสผ่าน",
        };
    }
  } catch {
    return unavailable;
  }
  redirect("/chat");
}

export async function updatePassword(
  _state: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const parsed = newPasswordSchema.safeParse({
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.success)
    return {
      status: "error",
      message: "ใช้รหัสผ่านอย่างน้อย 8 ตัวอักษร และกรอกยืนยันให้ตรงกัน",
    };
  const session = await getAuthenticatedSession();
  if (session.status !== "authenticated")
    return {
      status: "error",
      message: "ลิงก์หมดอายุ กรุณาขอลิงก์ตั้งรหัสผ่านใหม่",
    };
  try {
    const { error } = await session.supabase.auth.updateUser({
      password: parsed.data.password,
    });
    if (error) return unavailable;
  } catch {
    return unavailable;
  }
  redirect("/settings");
}

export async function signOut() {
  const supabase = await createClient();
  if (supabase) {
    let failed = false;
    try {
      const { error } = await supabase.auth.signOut({ scope: "local" });
      failed = Boolean(error);
    } catch {
      failed = true;
    }
    if (failed) redirect("/settings?error=signout");
  }
  redirect("/login");
}
