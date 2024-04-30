"use client";

import Link from "next/link";

export const metadata = {
  title: "500 Internal Error｜星期四 Thursday",
  robots: {
    index: false,
  },
};

const Error: React.FC = () => {
  return (
    <div className="h-dvh flex justify-center items-center py-16 px-5">
      <div className="card p-12 bg-base-100 shadow-xl">
        <h1>500 Internal Error</h1>
        <p>服务器内部产生了错误。请稍后重试。</p>
        <Link className="btn btn-primary" href="/">
          返回主页
        </Link>
      </div>
    </div>
  );
};

export default Error;
