export type AuthState = {
  status: "idle" | "error" | "success";
  message: string;
};
