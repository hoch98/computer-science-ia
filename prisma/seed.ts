import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

// Define an interface matching the JSON structure
interface ActivityInput {
  name: string;
  type: string;
  description: string;
  day: string;
  start_time: string | number;
  end_time: string | number;
  min_grade: number;
  max_grade: number;
}

async function main() {
  console.log('Seeding Database...');

  // 1. Read and parse the JSON file
  const jsonPath = path.join(__dirname, 'activities.json');
  const rawData = fs.readFileSync(jsonPath, 'utf-8');
  const activities: ActivityInput[] = JSON.parse(rawData);

  // 2. Clear existing records to avoid unique constraint errors on rerun (Optional)
  // Ordered child-to-parent to prevent foreign key violations
  await prisma.activitySchedule.deleteMany({});
  await prisma.activityKeyword.deleteMany({});
  await prisma.activity.deleteMany({});

  // 3. Insert the new data
  for (const act of activities) {
    // Convert string times from JSON to integers if necessary (e.g., "1130" -> 1130)
    const startTimeInt = typeof act.start_time === 'string' ? parseInt(act.start_time, 10) : act.start_time;
    const endTimeInt = typeof act.end_time === 'string' ? parseInt(act.end_time, 10) : act.end_time;

    await prisma.activity.create({
      data: {
        name: act.name,
        type: act.type,
        description: act.description,
        minGrade: act.min_grade,
        maxGrade: act.max_grade,
        // Leverage Prisma's nested writes to create the schedule simultaneously
        schedules: {
          create: {
            dayOfWeek: act.day,
            startTime: startTimeInt,
            endTime: endTimeInt,
          },
        },
      },
    });
  }

  console.log(`Successfully seeded ${activities.length} activities.`);
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });