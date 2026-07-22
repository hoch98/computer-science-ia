// app/api/activities/ranking/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { processDescription } from '@/lib/textProcessor'; // <-- Imported from its own utility file
import {
  calculateInverseDocumentFrequencies,
  calculateTermFrequencies,
  calculateTfidfVector,
  calculateCosineSimilarity,
} from '@/lib/scoring';

export async function POST(request: Request) {
  try {
    const content = await request.json();
    const payloadKeys = Object.keys(content);
    
    // makes sure body has required keys
    const requiredKeys = ["activities", "unavailable_slots", "grade", "tags"];
    const hasAllKeys = requiredKeys.every(k => payloadKeys.includes(k)) && payloadKeys.length === requiredKeys.length;

    if (!hasAllKeys) {
      return new NextResponse('not appropriate', { status: 400 });
    }

    const { activities: activitiesId, unavailable_slots, grade, tags } = content;

    // compile descriptions
    let processedDescription: string[] = [];
    for (const id of activitiesId) {
      const activity = await prisma.activity.findUnique({ where: { id: Number(id) } });
      if (activity) {
        processedDescription = processedDescription.concat(
          processDescription(`${activity.name} ${activity.description}`)
        );
      }
    }

    // fetch activites with schedule time and keywords
    const candidates = await prisma.activity.findMany({
      where: {
        minGrade: { lte: grade },
        maxGrade: { gte: grade },
      },
      include: { 
        schedules: true,
        keywords: true, 
      },
    });

    // filter out unavailable activities
    const validActivities = candidates.filter((activity) => {
      let collision = false;
      if (!tags.includes(activity.type)) return false;
      for (const unavail of unavailable_slots) {
        const [unavailDay, unavailStart, unavailEnd] = [unavail.day, unavail.startTime, unavail.endTime];
        
        for (const schedule of activity.schedules) {
          if (
            schedule.dayOfWeek === unavailDay &&
            schedule.startTime! < unavailEnd &&
            schedule.endTime! > unavailStart
          ) {
            collision = true;
            break;
          }
        }
        if (collision) break;
      }
      return !collision;
    });

    // bulds document term corpus
    const allTermsInDocuments: string[][] = [];
    for (const activity of validActivities) {
      const terms = processDescription(`${activity.name} ${activity.description}`);
      allTermsInDocuments.push(terms);
    }

    // check if structural text representation is already matching
    const targetString = JSON.stringify(processedDescription);
    const hasTargetInCorpus = allTermsInDocuments.some(doc => JSON.stringify(doc) === targetString);
    if (!hasTargetInCorpus) {
      allTermsInDocuments.push(processedDescription);
    }

    // 4. calculate IDF weights
    const idfWeights = calculateInverseDocumentFrequencies(allTermsInDocuments);

    // 5. create target vector with TF-IDF weighting
    const targetTf = calculateTermFrequencies(processedDescription);
    const targetVector = calculateTfidfVector(targetTf, idfWeights);

    // 6. creating rankings
    const rankings = [];

    for (let index = 0; index < validActivities.length; index++) {
      const activity = validActivities[index];

      // if the item ID matches input query targets list, exclude it
      if (activitiesId.includes(activity.id)) {
        continue;
      }

      const terms = allTermsInDocuments[index];
      const activityTf = calculateTermFrequencies(terms);
      const activityVector = calculateTfidfVector(activityTf, idfWeights);

      // Create unified mathematical spaces dimension
      const uniqueTerms = new Set([...Object.keys(activityVector), ...Object.keys(targetVector)]);
      
      const normalisedTarget: number[] = [];
      const normalisedCandidate: number[] = [];

      for (const term of uniqueTerms) {
        normalisedTarget.push(targetVector[term] !== undefined ? targetVector[term] : 0);
        normalisedCandidate.push(activityVector[term] !== undefined ? activityVector[term] : 0);
      }

      const similarityScore = calculateCosineSimilarity(normalisedTarget, normalisedCandidate);

      rankings.push({
        activity_id: activity.id,
        activity_name: activity.name,
        activity_type: activity.type,
        activity_schedules: activity.schedules,
        tags: activity.keywords.map(k => k.keyword),
        cosine_similarity: similarityScore,
      });
    }

    // sort by score
    rankings.sort((a, b) => b.cosine_similarity - a.cosine_similarity);

    // only take activites with <60% similarity, so duplicate activites of differnt time isn't included
    const filteredRankings = rankings.filter(item => item.cosine_similarity < 60);

    // on return first 10
    return NextResponse.json(filteredRankings.slice(0, 10));

  } catch (error) {
    console.error("Ranking API compilation error:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}