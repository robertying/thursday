// Checks the course list learnX uploads to courseX. learnX ships with no secret, so
// anyone can call the upload route; these checks and the write rules in
// db/learnx-write-rules.sql are what keep the public course pages sane.

export interface UploadedCourse {
  id: string;
  name: string;
  englishName: string;
  teacherId: string;
  teacherName: string;
  number: string;
  index: number;
  semesterId: string;
  /** Left out when learnX couldn't load it or it doesn't look right; the stored one is kept then. */
  timeAndLocation?: string[];
}

export const MAX_COURSES = 100;

const ID = /^[A-Za-z0-9_-]{1,64}$/;
const SEMESTER = /^(\d{4})-(\d{4})-([123])$/;
// Control and invisible formatting characters (zero-width spaces, bidi overrides).
const HIDDEN = /[\p{Cc}\p{Cf}]/u;

const text = (value: unknown, max: number, allowEmpty: boolean) => {
  if (typeof value !== "string") return null;
  const s = value.trim();
  if (s.length > max || HIDDEN.test(s)) return null;
  if (!allowEmpty && s.length === 0) return null;
  return s;
};

/** Semesters from two school years back to the next one, so a typo can't make up a year. */
const isPlausibleSemester = (id: string, now: Date) => {
  const m = SEMESTER.exec(id);
  if (!m) return false;
  const start = Number(m[1]);
  const year = now.getFullYear();
  return Number(m[2]) === start + 1 && start >= year - 2 && start <= year;
};

/** Returns the course, cleaned up, or null when it doesn't look like a real one. */
export const parseCourse = (
  value: unknown,
  now = new Date(),
): UploadedCourse | null => {
  if (typeof value !== "object" || value === null) return null;
  const c = value as Record<string, unknown>;

  const id = typeof c.id === "string" && ID.test(c.id) ? c.id : null;
  const teacherId =
    typeof c.teacherId === "string" && ID.test(c.teacherId)
      ? c.teacherId
      : null;
  const number =
    typeof c.number === "string" && ID.test(c.number) ? c.number : null;
  const semesterId =
    typeof c.semesterId === "string" && isPlausibleSemester(c.semesterId, now)
      ? c.semesterId
      : null;
  // Some sections are numbered far past 1000.
  const index =
    Number.isInteger(c.index) &&
    (c.index as number) >= 0 &&
    (c.index as number) <= 2147483647
      ? (c.index as number)
      : null;
  const name = text(c.name, 100, false);
  const englishName = text(c.englishName, 200, true);
  // Empty when the website doesn't say who teaches the course.
  const teacherName = text(c.teacherName, 50, true);

  if (
    id === null ||
    teacherId === null ||
    number === null ||
    semesterId === null ||
    index === null ||
    name === null ||
    englishName === null ||
    teacherName === null
  ) {
    return null;
  }

  // A schedule that doesn't look right is left out, keeping the stored one.
  let timeAndLocation: string[] | undefined;
  if (Array.isArray(c.timeAndLocation) && c.timeAndLocation.length <= 50) {
    const entries = c.timeAndLocation.map((e) => text(e, 500, true));
    if (entries.every((e) => e !== null)) timeAndLocation = entries;
  }

  return {
    id,
    name,
    englishName,
    teacherId,
    teacherName,
    number,
    index,
    semesterId,
    timeAndLocation,
  };
};
