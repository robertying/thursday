import { NextResponse } from "next/server";
import { GraphQLClient } from "graphql-request";
import { graphql } from "gql";
import {
  MAX_COURSES,
  parseCourse,
  type UploadedCourse,
} from "lib/learnxCourses";

// learnX uploads each user's course list here. The route is open to anyone, so it
// only passes on courses that look real, and writes them as the `learnx` Hasura
// role: the database triggers in db/learnx-write-rules.sql decide what an upload
// may change, the same as for old learnX versions that write with that role
// directly.

const WINDOW_MS = 10 * 60 * 1000;
// learnX uploads on every app start, and campus networks put many students
// behind one address.
const MAX_REQUESTS_PER_WINDOW = 120;
const requests = new Map<string, { start: number; count: number }>();

const isRateLimited = (ip: string) => {
  const now = Date.now();
  for (const [key, entry] of requests) {
    if (now - entry.start > WINDOW_MS) requests.delete(key);
  }
  const entry = requests.get(ip);
  if (!entry) {
    requests.set(ip, { start: now, count: 1 });
    return false;
  }
  entry.count += 1;
  return entry.count > MAX_REQUESTS_PER_WINDOW;
};

const clientIp = (req: Request) =>
  req.headers.get("x-real-ip") ??
  req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
  "unknown";

// Admin secret, acting as the learnx role so its permissions and triggers apply.
const learnxClient = new GraphQLClient(
  `${process.env.GRAPHQL_API_URL}/v1/graphql`,
  {
    headers: {
      "x-hasura-admin-secret": process.env.GRAPHQL_ADMIN_SECRET!,
      "x-hasura-role": "learnx",
      "x-hasura-user-id": process.env.LEARNX_USER_ID!,
    },
  },
);

// The mutation learnX has always sent; the triggers turn it into what's allowed.
const UploadCourses = graphql(/* GraphQL */ `
  mutation UploadLearnXCourses($objects: [course_insert_input!]!) {
    insert_course(
      objects: $objects
      on_conflict: {
        constraint: course_pkey
        update_columns: [time_location, name, englishName]
      }
    ) {
      affected_rows
    }
  }
`);

const toRow = (c: UploadedCourse) => ({
  id: c.id,
  name: c.name,
  englishName: c.englishName,
  teacher: {
    data: { id: c.teacherId, name: c.teacherName },
    on_conflict: {
      constraint: "teacher_pkey" as const,
      update_columns: ["name" as const],
    },
  },
  semester_id: c.semesterId,
  number: c.number,
  index: c.index,
  // The column is NOT NULL; the triggers never let '[]' replace a stored schedule.
  time_location: JSON.stringify(c.timeAndLocation ?? []),
});

export async function POST(req: Request) {
  const ip = clientIp(req);
  if (isRateLimited(ip)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const { version, courses } = (body ?? {}) as Record<string, unknown>;
  if (version !== 1) {
    return NextResponse.json(
      { error: "Unsupported payload version" },
      { status: 400 },
    );
  }
  if (!Array.isArray(courses) || courses.length > MAX_COURSES) {
    return NextResponse.json({ error: "Invalid courses" }, { status: 400 });
  }

  // One course that doesn't look right is skipped, so it can't block the rest.
  const valid = new Map<string, UploadedCourse>();
  for (const value of courses) {
    const course = parseCourse(value);
    if (course) valid.set(course.id, course);
  }
  const skipped = courses.length - valid.size;

  const rows = [...valid.values()];
  try {
    if (rows.length > 0) {
      await learnxClient.request(UploadCourses, { objects: rows.map(toRow) });
    }
  } catch (e) {
    console.error("learnX course upload failed", String(e));
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }

  // One line per upload in the container log, to find and undo bad data. No IP:
  // learnX's privacy policy says uploads carry nothing that identifies the user.
  console.log(
    JSON.stringify({
      event: "learnx-course-upload",
      at: new Date().toISOString(),
      courses: rows.map((c) => c.id),
      skipped,
    }),
  );

  return NextResponse.json({ courses: rows.length, skipped });
}
