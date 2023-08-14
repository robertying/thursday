import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import SearchBar from "components/SearchBar";
import client from "lib/client";
import { getSemesterTextFromId } from "lib/format";
import { graphql } from "gql";
import { GetCoursesQuery } from "gql/graphql";

export async function generateMetadata({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}): Promise<Metadata> {
  const query = searchParams.q ?? "";

  return {
    title: query
      ? `${query} - 搜索｜courseX - 课程信息共享计划`
      : `courseX - 课程信息共享计划`,
    description: "星期四大学课程信息共享计划。",
  };
}

const CourseX: React.FC<{
  searchParams: { [key: string]: string | string[] | undefined };
}> = async ({ searchParams }) => {
  const currentSemesterId = process.env.CURRENT_SEMESTER_ID;
  let currentSemesterCourseCount = 0;
  if (currentSemesterId) {
    const currentSemesterCourseCountResponse = await client.request(
      graphql(/* GraphQL */ `
        query GetCourseCount($semesterId: String!) {
          course_aggregate(where: { semester_id: { _eq: $semesterId } }) {
            aggregate {
              count
            }
          }
        }
      `),
      { semesterId: currentSemesterId }
    );
    currentSemesterCourseCount =
      currentSemesterCourseCountResponse.course_aggregate.aggregate?.count ?? 0;
  }

  const query = searchParams.q ?? "";
  let courses: GetCoursesQuery["course"] | null = null;
  if (query) {
    const response = await client.request(
      graphql(/* GraphQL */ `
        query GetCourses($query: String!, $currentSemesterId: String!) {
          course(
            where: {
              _and: [
                {
                  _or: [
                    { name: { _ilike: $query } }
                    { teacher: { name: { _ilike: $query } } }
                  ]
                }
                { semester_id: { _gte: $currentSemesterId } }
              ]
            }
            order_by: [{ semester_id: desc }, { updated_at: desc }]
          ) {
            id
            name
            teacher {
              id
              name
            }
            semester_id
          }
        }
      `),
      { query: `%${query}%`, currentSemesterId: currentSemesterId ?? "0" }
    );
    courses = response.course;
  }

  return (
    <main className="min-h-screen flex flex-col justify-center items-center py-16 px-5 prose-h1:mb-2 prose-p:my-0 text-center">
      <h1>
        course<span className="text-primary">X</span>
      </h1>
      <p className="pb-8">课程信息共享计划</p>
      {currentSemesterId && currentSemesterCourseCount !== 0 && (
        <p className="pb-4 text-base">
          已收录本学期 {getSemesterTextFromId(currentSemesterId)}课程{" "}
          {currentSemesterCourseCount} 门。
        </p>
      )}
      <Suspense
        fallback={
          <span className="loading loading-spinner loading-lg text-primary"></span>
        }
      >
        <SearchBar />
      </Suspense>
      {courses === null ? null : courses.length === 0 ? (
        <p className="pt-4">未找到相关课程。</p>
      ) : (
        <table className="table table-fixed mt-12">
          <thead>
            <tr>
              <th>学期</th>
              <th>课程</th>
              <th className="w-24">教师</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {courses.map((course) => (
              <tr key={course.id}>
                <td>{getSemesterTextFromId(course.semester_id, true)}</td>
                <td>{course.name}</td>
                <td>{course.teacher.name}</td>
                <td className="text-right">
                  <Link
                    className="btn btn-sm whitespace-nowrap"
                    href={`/courses/${course.id}`}
                  >
                    详情
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
};

export default CourseX;
