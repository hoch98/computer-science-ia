import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ name: string }> }
) {
  try {
    const resolvedParams = await params;
    const name = resolvedParams.name;
    const activities = await prisma.activity.findMany({
      where: {
        name: {
          contains: name,
        },
      },
      take: 5
    });

    return NextResponse.json(activities);
  } catch (_error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}