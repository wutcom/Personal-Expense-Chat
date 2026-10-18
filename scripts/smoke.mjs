// Run after a production build without Supabase environment values.
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const origin = "http://127.0.0.1:3103";
const server = spawn(
  process.execPath,
  [
    "node_modules/next/dist/bin/next",
    "start",
    "--hostname",
    "127.0.0.1",
    "--port",
    "3103",
  ],
  {
    cwd: fileURLToPath(new URL("../", import.meta.url)),
    stdio: ["ignore", "pipe", "pipe"],
    env: {
      ...process.env,
      NEXT_PUBLIC_SUPABASE_URL: "",
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "",
    },
  },
);
let started = false;
let output = "";
const timeout = setTimeout(() => {
  console.error("Production smoke timed out");
  process.exitCode = 1;
  server.kill("SIGTERM");
}, 30000);
server.stderr.on("data", (value) => process.stderr.write(value));
server.on("error", (error) => {
  console.error(error);
  process.exitCode = 1;
  clearTimeout(timeout);
});
server.on("exit", () => {
  clearTimeout(timeout);
  if (!started) process.exitCode = 1;
});
server.stdout.on("data", async (value) => {
  output += value.toString();
  if (started || !output.includes("Ready")) return;
  started = true;
  try {
    const cases = [
      ["/", 307, "/chat"],
      ["/chat", 307, "/login"],
      ["/dashboard", 307, "/login"],
      ["/budgets", 307, "/login"],
      ["/history", 307, "/login"],
      ["/settings", 307, "/login"],
      ["/reset-password", 307, "/login"],
      ["/login", 200, null],
      ["/api/account", 503, null],
      [
        "/auth/confirm?type=recovery&token_hash=invalid",
        307,
        "/login?error=link",
      ],
      ["/auth/callback?code=invalid", 307, "/login?error=link"],
      ["/unknown", 404, null],
    ];
    for (const [path, status, location] of cases) {
      const response = await fetch(origin + path, {
        redirect: "manual",
        signal: AbortSignal.timeout(10000),
      });
      const body = await response.text();
      if (response.status !== status)
        throw new Error(`${path}: expected ${status}, got ${response.status}`);
      if (
        location &&
        ![location, origin + location].includes(
          response.headers.get("location"),
        )
      )
        throw new Error(
          `${path}: unexpected redirect ${response.headers.get("location")}`,
        );
      if (
        !["/", "/unknown"].includes(path) &&
        !response.headers.get("cache-control")?.includes("no-store")
      )
        throw new Error(`${path}: missing no-store`);
      if (
        path === "/login" &&
        (!body.includes("ยังไม่ได้ตั้งค่า") || body.includes('name="password"'))
      )
        throw new Error(
          "Login must show setup notice without collecting credentials",
        );
      console.log(`${response.status} ${path}`);
    }
    console.log(
      `Production HTTP smoke passed: ${cases.length} paths, unconfigured mode.`,
    );
  } catch (error) {
    console.error(error);
    process.exitCode = 1;
  } finally {
    clearTimeout(timeout);
    server.kill("SIGTERM");
  }
});
