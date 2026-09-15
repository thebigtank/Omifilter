import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";

const configuredPath = process.env.DATABASE_PATH;
const dbPath =
  configuredPath && path.isAbsolute(configuredPath)
    ? configuredPath
    : path.join(process.cwd(), "data", "orders.db");

fs.mkdirSync(path.dirname(dbPath), { recursive: true });

export const db = new Database(dbPath, { timeout: 5000 });
db.pragma("journal_mode = WAL");

db.exec(`
  CREATE TABLE IF NOT EXISTS orders (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    reference     TEXT NOT NULL UNIQUE,
    email         TEXT NOT NULL,
    first_name    TEXT NOT NULL,
    last_name     TEXT NOT NULL,
    phone         TEXT NOT NULL,
    address       TEXT NOT NULL,
    state         TEXT NOT NULL,
    tier_slug     TEXT NOT NULL,
    tier_name     TEXT NOT NULL,
    qty           INTEGER NOT NULL,
    amount_kobo   INTEGER NOT NULL,
    currency      TEXT NOT NULL DEFAULT 'NGN',
    paid          INTEGER NOT NULL DEFAULT 0,
    verified_amount_kobo INTEGER,
    created_at    TEXT NOT NULL DEFAULT (datetime('now')),
    paid_at       TEXT
  );
  CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
`);

export type PendingOrderInput = {
  reference: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  address: string;
  state: string;
  tierSlug: string;
  tierName: string;
  qty: number;
  amountKobo: number;
};

export type Order = {
  id: number;
  reference: string;
  email: string;
  first_name: string;
  last_name: string;
  phone: string;
  address: string;
  state: string;
  tier_slug: string;
  tier_name: string;
  qty: number;
  amount_kobo: number;
  currency: string;
  paid: number;
  verified_amount_kobo: number | null;
  created_at: string;
  paid_at: string | null;
};

const insertStmt = db.prepare(`
  INSERT INTO orders (
    reference, email, first_name, last_name, phone, address, state,
    tier_slug, tier_name, qty, amount_kobo
  ) VALUES (
    @reference, @email, @firstName, @lastName, @phone, @address, @state,
    @tierSlug, @tierName, @qty, @amountKobo
  )
  ON CONFLICT(reference) DO NOTHING
`);

export function insertPendingOrder(input: PendingOrderInput): void {
  insertStmt.run(input);
}

const markPaidStmt = db.prepare(`
  UPDATE orders
  SET paid = 1, verified_amount_kobo = @verifiedAmountKobo, paid_at = datetime('now')
  WHERE reference = @reference
`);

export function markOrderPaid(reference: string, verifiedAmountKobo: number): void {
  markPaidStmt.run({ reference, verifiedAmountKobo });
}

const getByReferenceStmt = db.prepare(`SELECT * FROM orders WHERE reference = ?`);

export function getOrderByReference(reference: string): Order | undefined {
  return getByReferenceStmt.get(reference) as Order | undefined;
}

const getAllStmt = db.prepare(`SELECT * FROM orders ORDER BY created_at DESC`);

export function getAllOrders(): Order[] {
  return getAllStmt.all() as Order[];
}
