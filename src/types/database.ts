// Schema contract for 202610180001_initial_schema.sql. Regenerate with Supabase CLI after schema changes.
type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];
type Table<Row, Required extends keyof Row> = {
  Row: Row;
  Insert: Partial<Row> & Pick<Row, Required>;
  Update: Partial<Row>;
  Relationships: [];
};
type Owned = { user_id: string };
type Dated = { id: string; created_at: string };
type Profile = Owned & { display_name: string | null; created_at: string };
type Category = Owned &
  Dated & {
    slug: string;
    display_name: string;
    sort_order: number;
    is_active: boolean;
  };
type Budget = Owned &
  Dated & {
    category_id: string;
    month: string;
    planned_amount: number;
    updated_at: string;
  };
type Transaction = Owned &
  Dated & {
    category_id: string;
    kind: "expense" | "refund";
    amount: number;
    note: string | null;
    occurred_at: string;
    voided_at: string | null;
    updated_at: string;
  };
type Message = Owned &
  Dated & {
    role: "user" | "assistant";
    body: string;
    response_json: Json | null;
  };
type Execution = Owned &
  Dated & {
    idempotency_key: string;
    command_text: string;
    result_json: Json | null;
  };
type Settings = Owned & {
  timezone: string;
  currency: string;
  language: string;
};
export type Database = {
  public: {
    Tables: {
      profiles: Table<Profile, "user_id">;
      categories: Table<Category, "user_id" | "slug" | "display_name">;
      monthly_budgets: Table<
        Budget,
        "user_id" | "category_id" | "month" | "planned_amount"
      >;
      transactions: Table<
        Transaction,
        "user_id" | "category_id" | "kind" | "amount"
      >;
      chat_messages: Table<Message, "user_id" | "role" | "body">;
      command_executions: Table<
        Execution,
        "user_id" | "idempotency_key" | "command_text"
      >;
      user_settings: Table<Settings, "user_id">;
    };
    Views: { [_ in never]: never };
    Functions: { [_ in never]: never };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
};
