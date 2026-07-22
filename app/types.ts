import type { Activity } from "@prisma/client";

export interface ActivitySchedule {
  id: number;
  activityId: number;
  dayOfWeek: string;
  startTime: number | null;
  endTime: number | null;
}

export interface Recommendation {
  activity_id: number;
  activity_name: string;
  activity_type: string;
  tags: string[];
  activity_schedules: ActivitySchedule[];
  cosine_similarity: number;
}

export interface SelectedActivitySchedule {
  name: string;
  schedules: ActivitySchedule[];
}

export const ACTIVITY_TYPES = [
  "Service - Local",
  "Service - College",
  "Service - Global Concerns",
  "Sport, Health & Fitness",
  "Global & College Affairs",
  "Art, Design & Technology",
  "Language & Culture",
  "Music and Instrumental Teaching Programme",
  "Drama & Dance",
  "Academic - Languages",
] as const;


export interface TimetableEvent {
  id: string;
  title: string;
  day: "Mon" | "Tue" | "Wed" | "Thur" | "Fri";
  startTime: number; 
  endTime: number;
}
