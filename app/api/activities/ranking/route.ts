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
    
    // Strict JSON body key validation matching python:
    // set(["activities", "unavailable_slots", "grade"]) == set(content.keys())
    const requiredKeys = ["activities", "unavailable_slots", "grade"];
    const hasAllKeys = requiredKeys.every(k => payloadKeys.includes(k)) && payloadKeys.length === requiredKeys.length;

    if (!hasAllKeys) {
      return new NextResponse('not appropriate', { status: 400 });
    }

    const { activities: activitiesId, unavailable_slots, grade } = content;

    // 1. Compile target processed description
    let processedDescription: string[] = [];
    for (const id of activitiesId) {
      const activity = await prisma.activity.findUnique({ where: { id: Number(id) } });
      if (activity) {
        processedDescription = processedDescription.concat(
          processDescription(`${activity.name} ${activity.description}`)
        );
      }
    }

    // 2. Fetch all valid activities based on Grade parameters with both schedules and keywords included
    const candidates = await prisma.activity.findMany({
      where: {
        minGrade: { lte: grade },
        maxGrade: { gte: grade },
      },
      include: { 
        schedules: true,
        keywords: true, // <-- Fetching tags associated with this activity
      },
    });

    // Handle structural unavailability collision filters inside application space
    const validActivities = candidates.filter((activity) => {
      let collision = false;
      for (const unavail of unavailable_slots) {
        const [unavailDay, unavailStart, unavailEnd] = unavail;
        
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

    // 3. Build corpus document records
    const allTermsInDocuments: string[][] = [];
    for (const activity of validActivities) {
      const terms = processDescription(`${activity.name} ${activity.description}`);
      allTermsInDocuments.push(terms);
    }

    // Check if structural text representation is already matching
    const targetString = JSON.stringify(processedDescription);
    const hasTargetInCorpus = allTermsInDocuments.some(doc => JSON.stringify(doc) === targetString);
    if (!hasTargetInCorpus) {
      allTermsInDocuments.push(processedDescription);
    }

    // 4. Calculate IDF weights
    const idfWeights = calculateInverseDocumentFrequencies(allTermsInDocuments);

    // 5. Create Target Profile vector with TF-IDF weighting
    const targetTf = calculateTermFrequencies(processedDescription);
    const targetVector = calculateTfidfVector(targetTf, idfWeights);

    // 6. Creating rankings
    const rankings = [];

    for (let index = 0; index < validActivities.length; index++) {
      const activity = validActivities[index];

      // If the item ID matches input query targets list, exclude it
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
        tags: activity.keywords.map(k => k.keyword),
        cosine_similarity: similarityScore,
      });
    }

    // Sort Descending by score (this ensures we get the strongest matches below the 60% threshold first)
    rankings.sort((a, b) => b.cosine_similarity - a.cosine_similarity);

    // Filter to strictly keep activities that are less than 60% similar
    const filteredRankings = rankings.filter(item => item.cosine_similarity < 60);

    // Slice and return only the first 10 items from the filtered set
    return NextResponse.json(filteredRankings.slice(0, 10));

  } catch (error) {
    console.error("Ranking API compilation error:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}