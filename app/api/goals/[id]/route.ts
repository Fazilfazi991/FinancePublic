import { NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const g = await req.json();
    await sql`UPDATE goals SET 
      name=${g.name}, 
      target=${g.target}, 
      saved=${g.saved || 0}, 
      deadline=${g.deadline || null},
      description=${g.description || ''},
      category=${g.category || ''},
      manual_progress=${g.manualProgress || 0},
      notes=${g.notes || ''},
      last_updated=${g.lastUpdated || new Date().toISOString()},
      current_milestone=${g.currentMilestone || 0},
      total_milestones=${g.totalMilestones || 0},
      milestone_value=${g.milestoneValue || 0}
      WHERE id=${params.id}`;
    return NextResponse.json({ ok: true });
  } catch (e: any) { return NextResponse.json({ ok: false, error: e.message }, { status: 500 }); }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  try {
    await sql`DELETE FROM goals WHERE id=${params.id}`;
    return NextResponse.json({ ok: true });
  } catch (e: any) { return NextResponse.json({ ok: false, error: e.message }, { status: 500 }); }
}
