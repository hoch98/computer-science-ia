interface TimetableEvent {
  id: string;
  title: string;
  day: string;
  startTime: number; 
  endTime: number;
}

function getShortHand(full: string): string {
  const dayMap: Record<string, string> = {
    Monday: "Mon",
    Tuesday: "Tue",
    Wednesday: "Wed",
    Thursday: "Thur",
    Friday: "Fri",
    Saturday: "Sat",
    Sunday: "Sun",
  };

  return dayMap[full] || full;
}

export async function parseTimetableHtml(file: File): Promise<TimetableEvent[]> {

  // read html and parse as DOM
  const htmlText = await file.text();
  const parser = new DOMParser();
  const document = parser.parseFromString(htmlText, 'text/html');

  const allActivities: TimetableEvent[] = [];

  const dayGroups = document.querySelectorAll('.events-group');

  dayGroups.forEach((group) => {
    const dayHeader = group.querySelector('.top-info span');
    if (!dayHeader || !dayHeader.textContent) return;
    
    const dayFull = dayHeader.textContent.trim();
    const shortDay = getShortHand(dayFull);

    const events = group.querySelectorAll('.single-event');
    
    events.forEach((eventEl) => {
      const startAttr = eventEl.getAttribute('data-start');
      const endAttr = eventEl.getAttribute('data-end');

      if (!startAttr || !endAttr) return;

      const startTime = parseInt(startAttr.replace(':', ''), 10);
      const endTime = parseInt(endAttr.replace(':', ''), 10);

      const nameContainer = eventEl.querySelector('.event-name');
      if (!nameContainer || !nameContainer.textContent) return;

      const rawText = nameContainer.textContent;
      const title = rawText.split('[')[0].replace(/\s+/g, ' ').trim();

      allActivities.push({
        id: Math.random().toString(36).substring(2),
        title,
        day: shortDay,
        startTime,
        endTime
      });
    });
  });

  return allActivities;
}