"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { getSemesterTextFromId } from "lib/format";

const SearchBar: React.FC<{
  allSemesters: string[];
  selectedSemesterCourseCount: number;
}> = ({ allSemesters, selectedSemesterCourseCount }) => {
  const searchParams = useSearchParams();
  const initialQuery = (searchParams.get("q") ?? "") as string;
  const selectedSemesterId = (searchParams.get("s") ??
    process.env.CURRENT_SEMESTER_ID!) as string;

  const [query, setQuery] = useState(initialQuery);

  const handleSemesterChange = (
    event: React.ChangeEvent<HTMLSelectElement>,
  ) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("s", event.target.value);
    window.location.search = params.toString();
  };

  const handleQueryChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(event.target.value.trim());
  };

  return (
    <form className="w-full max-w-sm flex flex-col space-y-4">
      <label htmlFor="semester-select" className="text-sm font-normal">
        已收录{" "}
        <select
          id="semester-select"
          className="inline-block select select-sm select-bordered"
          name="s"
          value={selectedSemesterId}
          onChange={handleSemesterChange}
        >
          {allSemesters.map((semesterId) => (
            <option key={semesterId} value={semesterId}>
              {getSemesterTextFromId(semesterId)}
            </option>
          ))}
        </select>{" "}
        课程 {selectedSemesterCourseCount} 门
      </label>
      <div className="flex space-x-2">
        <input
          type="search"
          autoCapitalize="none"
          autoComplete="off"
          spellCheck="false"
          enterKeyHint="search"
          name="q"
          placeholder="课程名 / 教师名"
          className="input input-bordered w-full"
          value={query}
          onChange={handleQueryChange}
        />
        <button
          className="btn btn-primary px-6"
          type="submit"
          disabled={!query}
        >
          搜索
        </button>
      </div>
    </form>
  );
};

export default SearchBar;
