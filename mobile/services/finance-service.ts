import { getDb } from './database';
import type { FinanceSubscription, FinanceTransaction, Investment } from '@/types';

export async function listTransactions(): Promise<FinanceTransaction[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<{
    id: number;
    type: string;
    category: string;
    amount: number;
    date: string;
    source: string | null;
    note: string | null;
  }>(`SELECT * FROM finance_transactions ORDER BY date DESC, id DESC`);
  return rows.map((r) => ({
    id: r.id,
    type: r.type as FinanceTransaction['type'],
    category: r.category,
    amount: r.amount,
    date: r.date,
    source: r.source,
    note: r.note,
  }));
}

export async function addTransaction(input: {
  type: FinanceTransaction['type'];
  category: string;
  amount: number;
  date: string;
  source?: string | null;
  note?: string | null;
}): Promise<number> {
  const db = await getDb();
  const result = await db.runAsync(
    `INSERT INTO finance_transactions (type, category, amount, date, source, note) VALUES (?, ?, ?, ?, ?, ?)`,
    input.type,
    input.category,
    input.amount,
    input.date,
    input.source ?? null,
    input.note ?? null,
  );
  return result.lastInsertRowId;
}

export async function deleteTransaction(id: number): Promise<void> {
  const db = await getDb();
  await db.runAsync(`DELETE FROM finance_transactions WHERE id = ?`, id);
}

export async function listSubscriptions(): Promise<FinanceSubscription[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<{
    id: number;
    name: string;
    amount: number;
    billing_cycle: string;
    next_due: string | null;
    active: number;
  }>(`SELECT * FROM finance_subscriptions ORDER BY active DESC, id DESC`);
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    amount: r.amount,
    billingCycle: r.billing_cycle as FinanceSubscription['billingCycle'],
    nextDue: r.next_due,
    active: !!r.active,
  }));
}

export async function addSubscription(input: {
  name: string;
  amount: number;
  billingCycle?: FinanceSubscription['billingCycle'];
  nextDue?: string | null;
}): Promise<number> {
  const db = await getDb();
  const result = await db.runAsync(
    `INSERT INTO finance_subscriptions (name, amount, billing_cycle, next_due) VALUES (?, ?, ?, ?)`,
    input.name.trim(),
    input.amount,
    input.billingCycle ?? 'monthly',
    input.nextDue ?? null,
  );
  return result.lastInsertRowId;
}

export async function deleteSubscription(id: number): Promise<void> {
  const db = await getDb();
  await db.runAsync(`DELETE FROM finance_subscriptions WHERE id = ?`, id);
}

export async function listInvestments(kind?: Investment['kind']): Promise<Investment[]> {
  const db = await getDb();
  const rows = kind
    ? await db.getAllAsync<{
        id: number;
        kind: string;
        symbol: string;
        name: string | null;
        quantity: number;
        avg_cost: number;
        current_price: number | null;
        notes: string | null;
      }>(`SELECT * FROM investments WHERE kind = ? ORDER BY id DESC`, kind)
    : await db.getAllAsync<{
        id: number;
        kind: string;
        symbol: string;
        name: string | null;
        quantity: number;
        avg_cost: number;
        current_price: number | null;
        notes: string | null;
      }>(`SELECT * FROM investments ORDER BY id DESC`);
  return rows.map((r) => ({
    id: r.id,
    kind: r.kind as Investment['kind'],
    symbol: r.symbol,
    name: r.name,
    quantity: r.quantity,
    avgCost: r.avg_cost,
    currentPrice: r.current_price,
    notes: r.notes,
  }));
}

export async function addInvestment(input: {
  kind: Investment['kind'];
  symbol: string;
  name?: string | null;
  quantity: number;
  avgCost: number;
  currentPrice?: number | null;
  notes?: string | null;
}): Promise<number> {
  const db = await getDb();
  const result = await db.runAsync(
    `INSERT INTO investments (kind, symbol, name, quantity, avg_cost, current_price, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    input.kind,
    input.symbol.trim().toUpperCase(),
    input.name ?? null,
    input.quantity,
    input.avgCost,
    input.currentPrice ?? null,
    input.notes ?? null,
  );
  return result.lastInsertRowId;
}

export async function deleteInvestment(id: number): Promise<void> {
  const db = await getDb();
  await db.runAsync(`DELETE FROM investments WHERE id = ?`, id);
}

export function summarizeFinance(tx: FinanceTransaction[]) {
  const income = tx.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const expense = tx.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const byCategory: Record<string, number> = {};
  for (const t of tx.filter((x) => x.type === 'expense')) {
    byCategory[t.category] = (byCategory[t.category] ?? 0) + t.amount;
  }
  const bySource: Record<string, number> = {};
  for (const t of tx.filter((x) => x.type === 'income')) {
    const key = t.source || t.category;
    bySource[key] = (bySource[key] ?? 0) + t.amount;
  }
  return { income, expense, net: income - expense, byCategory, bySource };
}

export function summarizePortfolio(items: Investment[]) {
  let invested = 0;
  let value = 0;
  for (const i of items) {
    invested += i.quantity * i.avgCost;
    value += i.quantity * (i.currentPrice ?? i.avgCost);
  }
  return { invested, value, pnl: value - invested };
}
