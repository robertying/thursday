import { cache } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import client from "lib/client";
import { getSemesterTextFromId } from "lib/format";
import { graphql } from "gql";

const getCourseDetail = cache(async (id: string) => {
  const response = await client.request(
    graphql(/* GraphQL */ `
      query GetCourse($id: String!) {
        course_by_pk(id: $id) {
          id
          name
          englishName
          teacher {
            id
            name
          }
          time_location
          semester_id
          number
          index
        }
      }
    `),
    { id: id },
  );
  return response.course_by_pk;
});

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  const id = params.id;

  const course = await getCourseDetail(id);

  return {
    title: course
      ? `${course.name} - ${course.teacher.name}｜courseX - 课程信息共享计划`
      : `courseX - 课程信息共享计划`,
    description: "星期四大学课程信息共享计划。",
  };
}

const CourseDetail: React.FC<{
  params: { id: string };
}> = async ({ params }) => {
  const id = params.id;

  const course = await getCourseDetail(id);

  if (!course) {
    notFound();
  }

  let timeAndLocations: string[] = [];
  try {
    timeAndLocations = Array.from(JSON.parse(course.time_location));
  } catch {}

  return (
    <main className="min-h-dvh flex flex-col justify-center items-center py-16 px-5 prose-h1:mt-4 prose-h1:mb-0 prose-h1:leading-tight prose-h2:mt-4 prose-h2:mb-4 prose-p:my-0">
      <div className="card p-12 bg-base-100 shadow-xl">
        <p>{getSemesterTextFromId(course.semester_id)}</p>
        <p>
          {course.number}-{course.index}
        </p>
        <h1>{course.name}</h1>
        <p>{course.englishName === course.name ? null : course.englishName}</p>
        <h2>{course.teacher.name}</h2>
        <ul className="mb-0">
          {timeAndLocations.length > 0 &&
            timeAndLocations.map((item) => (
              <li key={item}>{item.replace("，", "").trim()}</li>
            ))}
        </ul>
      </div>
    </main>
  );
};

export default CourseDetail;
