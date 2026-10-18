import { z } from "zod";
const email = z
  .email()
  .max(254)
  .transform((value) => value.toLowerCase());
const password = z.string().min(8).max(128);
export const authSchema = z.discriminatedUnion("intent", [
  z.object({
    intent: z.literal("signin"),
    email,
    password: z.string().min(1).max(128),
  }),
  z.object({ intent: z.literal("signup"), email, password }),
  z.object({ intent: z.literal("reset"), email }),
]);
export const newPasswordSchema = z
  .object({ password, confirmPassword: password })
  .refine((value) => value.password === value.confirmPassword);
export const profileSchema = z
  .object({ display_name: z.string().trim().min(1).max(80) })
  .strict();
