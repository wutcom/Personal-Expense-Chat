// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { appendEntry, HEADERS, loadLedger } from "@/lib/expenses/sheets";

const { token } = vi.hoisted(() => ({ token: vi.fn() }));
vi.mock("google-auth-library", () => ({
  JWT: class {
    getAccessToken = token;
  },
}));

const owner = "00000000-0000-4000-8000-000000000001";
const rowId = "00000000-0000-4000-8000-000000000002";
const date = new Date("2026-10-31T17:00:00Z");
const entry = {
  kind: "expense" as const,
  category: "อาหาร",
  satang: 6550,
  note: "=SUM(A1:A5)",
};
const fetchMock = vi.fn<typeof fetch>();

beforeEach(() => {
  fetchMock.mockReset();
  token.mockReset().mockResolvedValue({ token: "fake-test-token" });
  vi.stubGlobal("fetch", fetchMock);
  vi.stubEnv("GOOGLE_SHEETS_SPREADSHEET_ID", "test-id");
  vi.stubEnv(
    "GOOGLE_SHEETS_CLIENT_EMAIL",
    "ledger@example.iam.gserviceaccount.com",
  );
  vi.stubEnv("GOOGLE_SHEETS_PRIVATE_KEY", "-----BEGIN PRIVATE KEY-----\\nfake");
  vi.stubEnv("GOOGLE_SHEETS_OWNER_ID", owner);
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("Google Sheets ledger", () => {
  it("checks the header and appends one RAW row, keeping formula-like notes as text", async () => {
    fetchMock
      .mockResolvedValueOnce(Response.json({ values: [HEADERS] }))
      .mockResolvedValueOnce(Response.json({ updates: { updatedRows: 1 } }));
    await appendEntry(owner, entry, date);
    const [url, request] = fetchMock.mock.calls[1];
    expect(String(url)).toContain("/values/Transactions!A1%3AG:append?");
    expect(new URL(String(url)).searchParams.get("valueInputOption")).toBe(
      "RAW",
    );
    expect(new URL(String(url)).searchParams.get("insertDataOption")).toBe(
      "INSERT_ROWS",
    );
    expect(request).toMatchObject({
      method: "POST",
      cache: "no-store",
      headers: { Authorization: "Bearer fake-test-token" },
    });
    expect(JSON.parse(String(request?.body)).values).toEqual([
      [
        expect.any(String),
        date.toISOString(),
        "2026-11-01",
        "expense",
        "อาหาร",
        65.5,
        "=SUM(A1:A5)",
      ],
    ]);
  });

  it("fails closed before requesting any token for other users or missing config", async () => {
    expect(await loadLedger(rowId)).toEqual({ status: "forbidden" });
    await expect(appendEntry(rowId, entry)).rejects.toThrow();
    vi.stubEnv("GOOGLE_SHEETS_OWNER_ID", "");
    expect(await loadLedger(owner)).toEqual({ status: "unconfigured" });
    expect(token).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("does not append if the ledger schema differs", async () => {
    fetchMock.mockResolvedValueOnce(Response.json({ values: [["wrong"]] }));
    await expect(appendEntry(owner, entry, date)).rejects.toThrow(
      "Unexpected ledger headers",
    );
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it("does not retry an unconfirmed append", async () => {
    fetchMock
      .mockResolvedValueOnce(Response.json({ values: [HEADERS] }))
      .mockRejectedValueOnce(new Error("timeout"));
    await expect(appendEntry(owner, entry, date)).rejects.toThrow("timeout");
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("reads numeric THB without display formatting and tolerates trailing blank notes", async () => {
    fetchMock.mockResolvedValueOnce(
      Response.json({
        values: [
          HEADERS,
          [rowId, date.toISOString(), "2026-11-01", "expense", "อาหาร", 65.5],
        ],
      }),
    );
    expect(await loadLedger(owner)).toEqual({
      status: "ready",
      rows: [
        {
          ...entry,
          note: "",
          id: rowId,
          createdAt: date.toISOString(),
          date: "2026-11-01",
        },
      ],
    });
    expect(String(fetchMock.mock.calls[0][0])).toContain(
      "valueRenderOption=UNFORMATTED_VALUE",
    );
  });

  it("does not show misleading totals when a saved row is malformed", async () => {
    fetchMock.mockResolvedValueOnce(
      Response.json({
        values: [
          HEADERS,
          [rowId, date.toISOString(), "2026-11-01", "expense", "อาหาร", "oops"],
        ],
      }),
    );
    expect(await loadLedger(owner)).toEqual({ status: "failed" });
  });
});
