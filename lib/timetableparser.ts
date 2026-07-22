
let pdfjsLibPromise: Promise<typeof import('pdfjs-dist')> | null = null;

async function loadPdfjs() {
  if (typeof window === 'undefined') {
    throw new Error('parseTimetablePdf can only run in the browser.');
  }
  if (!pdfjsLibPromise) {
    pdfjsLibPromise = import('pdfjs-dist').then((mod) => {
      mod.GlobalWorkerOptions.workerSrc = new URL(
        'pdfjs-dist/build/pdf.worker.min.mjs',
        import.meta.url
      ).toString();
      return mod;
    });
  }
  return pdfjsLibPromise;
}


interface TimetableEvent {
  id: string;
  title: string;
  day: string;
  startTime: number; 
  endTime: number;
}
const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const TIME_RANGE_RE = /^(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})$/;
const TEACHER_RE = /\[([^\]]+)\]/;

interface PositionedItem {
  text: string;
  x: number;
  y: number;
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

/** Reads every text item on every page of the PDF, with its x/y position. */
async function getPositionedItems(file: File): Promise<PositionedItem[][]> {
  const pdfjsLib = await loadPdfjs();
  const buffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;

  const pages: PositionedItem[][] = [];
  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const content = await page.getTextContent();

    const items: PositionedItem[] = content.items
      .map((item: any) => {
        const text = (item.str ?? '').trim();
        if (!text) return null;
        return {
          text,
          x: item.transform[4],
          y: item.transform[5],
        };
      })
      .filter((i): i is PositionedItem => i !== null);

    pages.push(items);
  }
  return pages;
}

/** Clusters items into visual rows based on y-coordinate proximity. */
function clusterRows(items: PositionedItem[], tolerance = 3): PositionedItem[][] {
  const sorted = [...items].sort((a, b) => b.y - a.y); // top of page first
  const rows: PositionedItem[][] = [];

  for (const item of sorted) {
    const row = rows.find((r) => Math.abs(r[0].y - item.y) <= tolerance);
    if (row) row.push(item);
    else rows.push([item]);
  }

  // sort items left-to-right within each row, keep rows top-to-bottom
  return rows.map((row) => row.sort((a, b) => a.x - b.x));
}

/** Finds the x-position of each day header, used to build column boundaries. */
function findDayColumnBoundaries(rows: PositionedItem[][]): { day: string; xStart: number; xEnd: number }[] {
  let headerRow: PositionedItem[] | null = null;
  for (const row of rows) {
    const matches = row.filter((i) => DAY_NAMES.includes(i.text));
    if (matches.length >= 3) {
      headerRow = matches;
      break;
    }
  }

  if (!headerRow) {
    throw new Error('Could not locate a header row containing weekday names in the PDF.');
  }

  const sortedHeaders = [...headerRow].sort((a, b) => a.x - b.x);
  return sortedHeaders.map((h, idx) => {
    const prevMid = idx === 0 ? -Infinity : (sortedHeaders[idx - 1].x + h.x) / 2;
    const nextMid = idx === sortedHeaders.length - 1 ? Infinity : (h.x + sortedHeaders[idx + 1].x) / 2;
    return { day: h.text, xStart: prevMid, xEnd: nextMid };
  });
}

/** Assigns each row to the day column whose x-range its items mostly fall in. */
function splitRowsByColumn(
  rows: PositionedItem[][],
  columns: { day: string; xStart: number; xEnd: number }[],
  headerY: number
): Record<string, PositionedItem[][]> {
  const byDay: Record<string, PositionedItem[][]> = {};
  columns.forEach((c) => (byDay[c.day] = []));

  for (const row of rows) {
    // skip the header row itself and anything above/at it
    if (row[0].y >= headerY) continue;

    // a single visual row can contain cells from multiple day columns
    // (e.g. two different subjects side-by-side at the same y); split it.
    for (const col of columns) {
      const cellItems = row.filter((i) => i.x >= col.xStart && i.x < col.xEnd);
      if (cellItems.length > 0) byDay[col.day].push(cellItems);
    }
  }

  return byDay;
}

/** Turns a column's rows into flat text lines, top-to-bottom. */
function rowsToLines(rows: PositionedItem[][]): string[] {
  return rows
    .sort((a, b) => b[0].y - a[0].y)
    .map((row) => row.map((i) => i.text).join(' ').replace(/\s+/g, ' ').trim())
    .filter(Boolean);
}

function parseColumnLines(day: string, lines: string[]): TimetableEvent[] {
  const activities: TimetableEvent[] = [];
  let i = 0;

  while (i < lines.length) {
    const match = lines[i].match(TIME_RANGE_RE);
    if (!match) {
      i++;
      continue;
    }

    const [, startTime, endTime] = match;
    i++;

    // skip a duplicated time-range line, if present
    while (i < lines.length && TIME_RANGE_RE.test(lines[i]) && lines[i] === lines[i - 1]) {
      i++;
    }
    if (i < lines.length && TIME_RANGE_RE.test(lines[i])) {
      i++; // second copy with identical range but re-matched pattern
    }

    // collect description lines until the next time range or end of column
    const descLines: string[] = [];
    while (i < lines.length && !TIME_RANGE_RE.test(lines[i])) {
      descLines.push(lines[i]);
      i++;
    }

    if (descLines.length === 0) continue;

    const activityName = descLines[0].replace(TEACHER_RE, '').trim();
    const middleLines = descLines.slice(1, descLines.length > 1 ? -1 : undefined);

    activities.push({
      "id": Math.random().toString(36).substring(2),
      "day":getShortHand(day),
      "title": [activityName, ...middleLines].filter(Boolean).join(' ').trim().split("[")[0],
      "startTime": parseInt(startTime.replace(":", "")),
      "endTime": parseInt(endTime.replace(":", ""))
    });
  }

  return activities;
}

export async function parseTimetablePdf(file: File): Promise<TimetableEvent[]> {
  const pages = await getPositionedItems(file);
  const allActivities: TimetableEvent[] = [];

  for (const items of pages) {
    if (items.length === 0) continue;

    const rows = clusterRows(items);
    const columns = findDayColumnBoundaries(rows);
    const headerY = rows.find((r) => r.some((i) => DAY_NAMES.includes(i.text)))?.[0].y ?? Infinity;
    const byDay = splitRowsByColumn(rows, columns, headerY);

    for (const col of columns) {
      const lines = rowsToLines(byDay[col.day]);
      allActivities.push(...parseColumnLines(col.day, lines));
    }
  }

  return allActivities
}