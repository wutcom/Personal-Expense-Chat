import "server-only";
import { randomUUID } from "node:crypto";
import { JWT } from "google-auth-library";
import { z } from "zod";
import { bangkokDate, entrySchema, type Entry, type LedgerRow } from "./entry";

export const HEADERS = [
  "id",
  "created_at",
  "date",
  "type",
  "category",
  "amount_thb",
  "note",
] as const;
const configSchema = z.object({
  spreadsheetId: z.string().regex(/^[\w-]+$/),
  clientEmail: z.email(),
  privateKey: z.string().startsWith("-----BEGIN PRIVATE KEY-----"),
  ownerId: z.uuid(),
});

function configuration() {
  return configSchema.safeParse({
    spreadsheetId: process.env.GOOGLE_SHEETS_SPREADSHEET_ID?.trim(),
    clientEmail: process.env.GOOGLE_SHEETS_CLIENT_EMAIL?.trim(),
    privateKey: process.env.GOOGLE_SHEETS_PRIVATE_KEY?.replaceAll(
      "\\n",
      "\n",
    ).trim(),
    ownerId: process.env.GOOGLE_SHEETS_OWNER_ID?.trim(),
  });
}

export function ledgerAccess(userId: string) {
  const config = configuration();
  if (!config.success) return "unconfigured";
  return config.data.ownerId === userId ? "ready" : "forbidden";
}

export const ledgerUnavailable = {
  unconfigured: "ยังไม่ได้ตั้งค่า Google Sheets สำหรับบันทึกรายการ",
  forbidden: "บัญชีนี้ไม่มีสิทธิ์เข้าถึงสมุดรายจ่าย",
  failed:
    "อ่านข้อมูลจาก Google Sheets ไม่สำเร็จ กรุณาตรวจการเชื่อมต่อและหัวตาราง",
};

type Config = z.infer<typeof configSchema>;
async function connect(userId: string) {
  const config = configuration();
  if (!config.success || config.data.ownerId !== userId)
    throw new Error("Ledger unavailable");
  const client = new JWT({
    email: config.data.clientEmail,
    key: config.data.privateKey,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
  const { token } = await client.getAccessToken();
  if (!token) throw new Error("No Sheets access token");
  return { config: config.data, token };
}

function valuesUrl(config: Config, range: string, append = false) {
  return new URL(
    `https://sheets.googleapis.com/v4/spreadsheets/${config.spreadsheetId}/values/${encodeURIComponent(range)}${append ? ":append" : ""}`,
  );
}

const valuesSchema = z.object({
  values: z.array(z.array(z.unknown())).optional(),
});
async function readRows(
  connection: Awaited<ReturnType<typeof connect>>,
  range: string,
) {
  const url = valuesUrl(connection.config, range);
  url.searchParams.set("valueRenderOption", "UNFORMATTED_VALUE");
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${connection.token}` },
    cache: "no-store",
    redirect: "error",
    signal: AbortSignal.timeout(10000),
  });
  if (!response.ok) throw new Error("Sheets read failed");
  const { values = [] } = valuesSchema.parse(await response.json());
  const [header, ...rows] = values;
  if (
    header?.length !== HEADERS.length ||
    !HEADERS.every((name, index) => header[index] === name)
  ) {
    throw new Error("Unexpected ledger headers");
  }
  return rows;
}

export async function appendEntry(
  userId: string,
  input: Entry,
  now = new Date(),
) {
  const entry = entrySchema.parse(input);
  const connection = await connect(userId);
  // Refuse to append to a sheet with the wrong schema or a missing header.
  await readRows(connection, "Transactions!A1:G1");
  const url = valuesUrl(connection.config, "Transactions!A1:G", true);
  url.searchParams.set("valueInputOption", "RAW");
  url.searchParams.set("insertDataOption", "INSERT_ROWS");
  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${connection.token}`,
      "Content-Type": "application/json",
    },
    cache: "no-store",
    redirect: "error",
    signal: AbortSignal.timeout(10000),
    body: JSON.stringify({
      values: [
        [
          randomUUID(),
          now.toISOString(),
          bangkokDate(now),
          entry.kind,
          entry.category,
          entry.satang / 100,
          entry.note,
        ],
      ],
    }),
  });
  if (
    !response.ok ||
    !z
      .object({ updates: z.object({ updatedRows: z.literal(1) }) })
      .safeParse(await response.json()).success
  ) {
    throw new Error("Append not confirmed");
  }
}

function decodeRow(row: unknown[]): LedgerRow {
  const [id, createdAt, date, kind, category, amount, note = ""] = row;
  const satang = typeof amount === "number" ? Math.round(amount * 100) : NaN;
  const parsed = z
    .object({ id: z.uuid(), createdAt: z.iso.datetime(), date: z.iso.date() })
    .parse({ id, createdAt, date });
  if (typeof amount !== "number" || Math.abs(amount * 100 - satang) > 0.00001) {
    throw new Error("Invalid ledger amount");
  }
  return { ...parsed, ...entrySchema.parse({ kind, category, satang, note }) };
}

type LedgerResult =
  | { status: "ready"; rows: LedgerRow[] }
  | { status: keyof typeof ledgerUnavailable };

export async function loadLedger(userId: string): Promise<LedgerResult> {
  const access = ledgerAccess(userId);
  if (access !== "ready") return { status: access };
  try {
    const connection = await connect(userId);
    const rows = await readRows(connection, "Transactions!A1:G");
    return {
      status: "ready" as const,
      rows: rows
        .filter((row) => row.some((value) => value !== "" && value != null))
        .map(decodeRow),
    };
  } catch {
    return { status: "failed" as const };
  }
}
