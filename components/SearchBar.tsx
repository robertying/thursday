"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";

const SearchBar: React.FC = () => {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") ?? "";

  const [query, setQuery] = useState(initialQuery);

  return (
    <form className="w-full max-w-sm flex space-x-2">
      <input
        type="text"
        autoCapitalize="none"
        autoComplete="off"
        spellCheck="false"
        enterKeyHint="search"
        name="q"
        placeholder="课程名 / 教师名"
        className="input input-bordered w-full"
        value={query}
        onChange={(e) => setQuery(e.target.value.trim())}
      />
      <button className="btn btn-primary px-6" type="submit" disabled={!query}>
        搜索
      </button>
    </form>
  );
};

export default SearchBar;
