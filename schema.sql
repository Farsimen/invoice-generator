-- Invoice Generator D1 Database Schema
-- Run once: wrangler d1 execute invoice-generator --file=schema.sql

CREATE TABLE IF NOT EXISTS invoices (
  id TEXT PRIMARY KEY,
  device_id TEXT NOT NULL,
  number TEXT NOT NULL,
  date TEXT NOT NULL,
  persian_date TEXT NOT NULL,
  company_name TEXT,
  customer_name TEXT,
  services_json TEXT NOT NULL,
  subtotal REAL NOT NULL DEFAULT 0,
  total_discount REAL NOT NULL DEFAULT 0,
  tax REAL NOT NULL DEFAULT 0,
  grand_total REAL NOT NULL DEFAULT 0,
  services_count INTEGER NOT NULL DEFAULT 0,
  notes TEXT,
  has_pdf INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_invoices_device_date ON invoices(device_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_invoices_number ON invoices(number);
