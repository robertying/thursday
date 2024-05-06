"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const BreadCrumbs: React.FC = () => {
  const pathname = usePathname();

  const segments = pathname.split("/").filter((segment) => segment !== "");

  return (
    <div className="prose-ul:my-0 mt-1 text-sm max-w-screen breadcrumbs absolute">
      <ul>
        {segments.length > 0 && (
          <li>
            <Link href="/">星期四 Thursday</Link>
          </li>
        )}
        {segments?.[0] === "courses" && (
          <li>
            {segments.length === 1 ? (
              "courseX"
            ) : (
              <Link href="/courses">courseX</Link>
            )}
          </li>
        )}
        {segments?.[0] === "learnX" && <li>learnX</li>}
        {segments?.[0] === "learnX-companion" && <li>learnX Companion</li>}
        {segments?.[0] === "courses" && segments.length === 2 && (
          <li>课程详情</li>
        )}
      </ul>
    </div>
  );
};

export default BreadCrumbs;
