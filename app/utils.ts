export const formatScheduleTime = (time: number | null): string => {
  if (time === null || time === undefined) return "N/A";

  const hours = Math.floor(time / 100);
  const minutes = time % 100;

  const date = new Date();
  date.setHours(hours, minutes, 0, 0);

  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

export function getFullDayName(shorthand: string): string {
  const dayMap: Record<string, string> = {
    Mon: "Monday",
    Tue: "Tuesday",
    Wed: "Wednesday",
    Thu: "Thursday",
    Fri: "Friday",
    Sat: "Saturday",
    Sun: "Sunday",
  };

  return dayMap[shorthand] || shorthand;
}