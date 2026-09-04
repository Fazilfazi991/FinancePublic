import { NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function GET() {
  try {
    const rows = await sql`SELECT * FROM app_settings`;
    const settings: Record<string, any> = {
      currency: 'INR', secondaryCurrency: 'AED', aedToInr: 25, theme: 'dark',
      name: 'User', accentColor: '#10b981', onboarded: false, migrated_real_data: false
    };
    rows.forEach((r: any) => {
      try { settings[r.key] = JSON.parse(r.value); } catch { settings[r.key] = r.value; }
    });
    return NextResponse.json(settings);
  } catch { return NextResponse.json({}); }
}

export async function PUT(req: Request) {
  try {
    const data = await req.json();
    for (const [key, value] of Object.entries(data)) {
      const v = JSON.stringify(value);
      await sql`INSERT INTO app_settings (key, value) VALUES (${key}, ${v}) ON CONFLICT (key) DO UPDATE SET value = ${v}`;
    }
    return NextResponse.json({ ok: true });
  } catch (e: any) { return NextResponse.json({ ok: false, error: e.message }, { status: 500 }); }
}
