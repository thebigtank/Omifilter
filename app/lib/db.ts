import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import type { PaymentMethod, PodStatus } from "./payment";

const configuredPath = process.env.DATABASE_PATH;
const dbPath =
  configuredPath && path.isAbsolute(configuredPath)
    ? configuredPath
    : path.join(process.cwd(), "data", "orders.db");

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
  paymentMethod: PaymentMethod;
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
  payment_method: PaymentMethod;
  pod_status: PodStatus | null;
};

/**
 * Opened on first use, not at import: `next build` imports this module from
 * several workers at once to collect page config, and opening (and creating)
 * the file there made them race for the lock ("database is locked").
 */
function openDatabase() {
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });

  const db = new Database(dbPath, { timeout: 5000 });
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
      paid_at       TEXT,
      payment_method TEXT NOT NULL DEFAULT 'paystack',
      pod_status    TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
  `);

  // Databases created before pay-on-delivery existed don't have these columns,
  // and CREATE TABLE IF NOT EXISTS won't add them. Existing rows were all
  // Paystack orders, which the payment_method default covers. IMMEDIATE takes
  // the write lock before checking, so two server processes starting at once
  // can't both try to add the same column.
  db.transaction(() => {
    const existingColumns = new Set(
      (db.prepare(`PRAGMA table_info(orders)`).all() as { name: string }[]).map((c) => c.name),
    );
    if (!existingColumns.has("payment_method")) {
      db.exec(`ALTER TABLE orders ADD COLUMN payment_method TEXT NOT NULL DEFAULT 'paystack'`);
    }
    if (!existingColumns.has("pod_status")) {
      db.exec(`ALTER TABLE orders ADD COLUMN pod_status TEXT`);
    }
  }).immediate();

  return {
    insert: db.prepare(`
      INSERT INTO orders (
        reference, email, first_name, last_name, phone, address, state,
        tier_slug, tier_name, qty, amount_kobo, payment_method, pod_status
      ) VALUES (
        @reference, @email, @firstName, @lastName, @phone, @address, @state,
        @tierSlug, @tierName, @qty, @amountKobo, @paymentMethod, @podStatus
      )
      ON CONFLICT(reference) DO NOTHING
    `),
    markPaid: db.prepare(`
      UPDATE orders
      SET paid = 1, verified_amount_kobo = @verifiedAmountKobo, paid_at = datetime('now')
      WHERE reference = @reference
    `),
    // "delivered" means the rider collected the money, so it also marks the
    // order paid. Any other status clears paid, so a mistaken "delivered" can
    // be undone.
    setPodStatus: db.prepare(`
      UPDATE orders
      SET pod_status = @status,
          paid = CASE WHEN @status = 'delivered' THEN 1 ELSE 0 END,
          paid_at = CASE WHEN @status = 'delivered' THEN COALESCE(paid_at, datetime('now')) ELSE NULL END,
          verified_amount_kobo = CASE WHEN @status = 'delivered' THEN amount_kobo ELSE NULL END
      WHERE reference = @reference AND payment_method = 'pod'
    `),
    getByReference: db.prepare(`SELECT * FROM orders WHERE reference = ?`),
    getAll: db.prepare(`SELECT * FROM orders ORDER BY created_at DESC`),
  };
}

let cached: ReturnType<typeof openDatabase> | undefined;

function statements() {
  return (cached ??= openDatabase());
}

export function insertPendingOrder(input: PendingOrderInput): void {
  statements().insert.run({ ...input, podStatus: input.paymentMethod === "pod" ? "pending" : null });
}

export function markOrderPaid(reference: string, verifiedAmountKobo: number): void {
  statements().markPaid.run({ reference, verifiedAmountKobo });
}

/** Returns false when no pay-on-delivery order has that reference. */
export function setPodStatus(reference: string, status: PodStatus): boolean {
  return statements().setPodStatus.run({ reference, status }).changes > 0;
}

export function getOrderByReference(reference: string): Order | undefined {
  return statements().getByReference.get(reference) as Order | undefined;
}

export function getAllOrders(): Order[] {
  return statements().getAll.all() as Order[];
}
