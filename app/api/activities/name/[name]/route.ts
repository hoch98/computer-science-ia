import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ name: string }> }
) {
  try {
    const resolvedParams = await params; // 2. Await the params object
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
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}