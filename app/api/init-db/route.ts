import { NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function GET() {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS debts (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        total NUMERIC NOT NULL DEFAULT 0,
        balance NUMERIC NOT NULL DEFAULT 0,
        rate NUMERIC NOT NULL DEFAULT 0,
        min_payment NUMERIC NOT NULL DEFAULT 0,
        notes TEXT DEFAULT '',
        color TEXT DEFAULT '#E24B4A'
      )
    `;
    await sql`
      CREATE TABLE IF NOT EXISTS accounts (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        institution TEXT NOT NULL,
        type TEXT NOT NULL DEFAULT 'savings',
        currency TEXT NOT NULL DEFAULT 'INR',
        opening_balance NUMERIC NOT NULL DEFAULT 0,
        color TEXT DEFAULT '#10b981',
        created_at TEXT,
        is_default BOOLEAN DEFAULT false,
        notes TEXT DEFAULT '',
        tag TEXT DEFAULT '',
        icon TEXT DEFAULT 'wallet'
      )
    `;
    await sql`
      CREATE TABLE IF NOT EXISTS transactions (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL,
        amount NUMERIC NOT NULL,
        account_id TEXT NOT NULL,
        to_account_id TEXT,
        category TEXT NOT NULL DEFAULT '',
        description TEXT NOT NULL DEFAULT '',
        date TEXT NOT NULL,
        currency TEXT NOT NULL DEFAULT 'INR',
        created_at TEXT,
        income_stream_id TEXT,
        notes TEXT DEFAULT ''
      )
    `;
    await sql`
      CREATE TABLE IF NOT EXISTS incomes (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        type TEXT NOT NULL DEFAULT 'Business',
        status TEXT NOT NULL DEFAULT 'active',
        currency TEXT,
        expected_monthly NUMERIC DEFAULT 0,
        actual_this_month NUMERIC DEFAULT 0,
        notes TEXT DEFAULT '',
        color TEXT DEFAULT '#10b981',
        icon TEXT DEFAULT 'briefcase',
        linked_account_id TEXT DEFAULT ''
      )
    `;
    await sql`
      CREATE TABLE IF NOT EXISTS goals (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        target NUMERIC NOT NULL DEFAULT 0,
        saved NUMERIC NOT NULL DEFAULT 0,
        deadline TEXT,
        description TEXT,
        category TEXT,
        manual_progress NUMERIC DEFAULT 0,
        created_at TEXT,
        notes TEXT,
        last_updated TEXT,
        current_milestone NUMERIC DEFAULT 0,
        total_milestones NUMERIC DEFAULT 0,
        milestone_value NUMERIC DEFAULT 0
      )
    `;
    
    // Migration: Add columns if they don't exist
    try {
      await sql`ALTER TABLE goals ADD COLUMN IF NOT EXISTS description TEXT`;
      await sql`ALTER TABLE goals ADD COLUMN IF NOT EXISTS category TEXT`;
      await sql`ALTER TABLE goals ADD COLUMN IF NOT EXISTS manual_progress NUMERIC DEFAULT 0`;
      await sql`ALTER TABLE goals ADD COLUMN IF NOT EXISTS created_at TEXT`;
      await sql`ALTER TABLE goals ADD COLUMN IF NOT EXISTS notes TEXT`;
      await sql`ALTER TABLE goals ADD COLUMN IF NOT EXISTS last_updated TEXT`;
      await sql`ALTER TABLE goals ADD COLUMN IF NOT EXISTS current_milestone NUMERIC DEFAULT 0`;
      await sql`ALTER TABLE goals ADD COLUMN IF NOT EXISTS total_milestones NUMERIC DEFAULT 0`;
      await sql`ALTER TABLE goals ADD COLUMN IF NOT EXISTS milestone_value NUMERIC DEFAULT 0`;
    } catch (e) {
      console.log("Migration columns might already exist");
    }

    await sql`
      CREATE TABLE IF NOT EXISTS expenses (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        budgeted NUMERIC NOT NULL DEFAULT 0,
        spent NUMERIC NOT NULL DEFAULT 0,
        category TEXT NOT NULL DEFAULT ''
      )
    `;
    await sql`
      CREATE TABLE IF NOT EXISTS app_settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      )
    `;
    return NextResponse.json({ ok: true, message: 'All tables created.' });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
