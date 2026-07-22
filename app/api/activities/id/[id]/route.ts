import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const activityId = parseInt(resolvedParams.id, 10);
    
    if (isNaN(activityId)) {
      return NextResponse.json({ error: 'invalid ID' }, { status: 400 });
    }

    const activity = await prisma.activity.findUnique({
      where: { id: activityId },
      include: { schedules: true }
    });

    if (!activity) {
      return NextResponse.json({ error: 'Activity not found' }, { status: 404 });
    }

    return NextResponse.json(activity);
  } catch (_error) {
    return NextResponse.json({ error: 'Server Error' }, { status: 500 });
  }
}