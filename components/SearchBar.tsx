"use client";

import { useState } from "react";
import { usePathname, useSearchParams, useRouter } from "next/navigation";

const SearchBar: React.FC = () => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") ?? "";

  const [query, setQuery] = useState(initialQuery);

  const handleSearch = () => {
    router.push(`${pathname}?q=${query}`);
  };

  return (
    <div className="w-full max-w-sm flex space-x-2">
      <input
        type="text"
        autoCapitalize="none"
        autoComplete="off"
        spellCheck="false"
        enterKeyHint="search"
        placeholder="课程名 / 教师名"
        className="input input-bordered w-full"
        value={query}
        onChange={(e) => setQuery(e.target.value.trim())}
      />
      <button
        className="btn btn-primary px-6"
        onClick={handleSearch}
        disabled={!query}
      >
        搜索
      </button>
    </div>
  );
};

export default SearchBar;
