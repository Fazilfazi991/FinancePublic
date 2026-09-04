import { NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function GET() {
  try {
    const rows = await sql`SELECT * FROM goals ORDER BY name`;
    const goals = rows.map((r: any) => ({
      id: r.id, 
      name: r.name, 
      target: Number(r.target), 
      saved: Number(r.saved), 
      deadline: r.deadline || undefined,
      description: r.description || '',
      category: r.category || '',
      manualProgress: Number(r.manual_progress || 0),
      createdAt: r.created_at || new Date().toISOString(),
      notes: r.notes || '',
      lastUpdated: r.last_updated || new Date().toISOString(),
      currentMilestone: Number(r.current_milestone || 0),
      totalMilestones: Number(r.total_milestones || 0),
      milestoneValue: Number(r.milestone_value || 0)
    }));
    return NextResponse.json(goals);
  } catch { return NextResponse.json([]); }
}

export async function POST(req: Request) {
  try {
    const g = await req.json();
    await sql`INSERT INTO goals (id, name, target, saved, deadline, description, category, manual_progress, created_at, notes, last_updated, current_milestone, total_milestones, milestone_value)
      VALUES (${g.id}, ${g.name}, ${g.target}, ${g.saved || 0}, ${g.deadline || null}, ${g.description || ''}, ${g.category || ''}, ${g.manualProgress || 0}, ${g.createdAt}, ${g.notes || ''}, ${g.lastUpdated}, ${g.currentMilestone || 0}, ${g.totalMilestones || 0}, ${g.milestoneValue || 0})`;
    return NextResponse.json({ ok: true });
  } catch (e: any) { return NextResponse.json({ ok: false, error: e.message }, { status: 500 }); }
}
