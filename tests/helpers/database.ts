import { PGlite } from "@electric-sql/pglite";
import { readFile } from "node:fs/promises";
export const userA = "11111111-1111-4111-8111-111111111111";
export const userB = "22222222-2222-4222-8222-222222222222";
export const categoryA = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
export const categoryB = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
export const tables = [
  "profiles",
  "user_settings",
  "categories",
  "monthly_budgets",
  "transactions",
  "chat_messages",
  "command_executions",
] as const;
export async function createTestDatabase() {
  const db = new PGlite();
  await db.exec(`create role anon nologin; create role authenticated nologin;
    create schema auth; create table auth.users (id uuid primary key);
    create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
    grant usage on schema auth to authenticated, anon; grant execute on function auth.uid() to authenticated, anon;`);
  await db.exec(
    await readFile(
      new URL(
        "../../supabase/migrations/202610180001_initial_schema.sql",
        import.meta.url,
      ),
      "utf8",
    ),
  );
  for (const [id, category] of [
    [userA, categoryA],
    [userB, categoryB],
  ]) {
    await db.query("insert into auth.users values ($1)", [id]);
    await db.query(
      "insert into categories (id,user_id,slug,display_name) values ($1,$2,'car','Car')",
      [category, id],
    );
    await db.query(
      "insert into monthly_budgets (user_id,category_id,month,planned_amount) values ($1,$2,'2026-10-01',10000)",
      [id, category],
    );
    await db.query(
      "insert into transactions (user_id,category_id,kind,amount) values ($1,$2,'expense',500)",
      [id, category],
    );
    await db.query(
      "insert into chat_messages (user_id,role,body) values ($1,'user','จ่าย car 500')",
      [id],
    );
    await db.query(
      "insert into command_executions (user_id,idempotency_key,command_text) values ($1,gen_random_uuid(),'test')",
      [id],
    );
  }
  return db;
}
export async function asUser<T>(
  db: PGlite,
  user: string | null,
  run: () => Promise<T>,
) {
  await db.exec("begin; set local role " + (user ? "authenticated" : "anon"));
  await db.query("select set_config('request.jwt.claim.sub',$1,true)", [
    user ?? "",
  ]);
  try {
    return await run();
  } finally {
    await db.exec("rollback");
  }
}
